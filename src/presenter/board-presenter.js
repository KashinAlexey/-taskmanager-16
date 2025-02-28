import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import TaskListView from '../view/task-list-view.js';
import NoTaskView from '../view/no-task-view.js';
import LoadMoreButtonView from '../view/load-more-button-view.js';
import LoadingView from '../view/loading-view.js';
import TaskPresenter, {State as TaskPresenterViewState} from './task-presenter.js';
import {render, RenderPosition, remove} from '../utils/render.js';
import {sortTaskUp, sortTaskDown} from '../utils/task.js';
import {SortType, UpdateType, UserAction, FilterType} from '../const.js';
import {filter} from '../utils/filter.js';
import TaskNewPresenter from './task-new-presenter.js';

const TASK_COUNT_PER_STEP = 8;

export default class BoardPresenter {
  #boardContainer = null;
  #tasksModel = null;
  #filterModel = null;

  #boardComponent = new BoardView();
  #taskListComponent = new TaskListView();
  #loadingComponent = new LoadingView();
  #sortComponent = null;
  #loadMoreButtonComponent = null;
  #noTaskComponent = null;

  #renderedTaskCount = TASK_COUNT_PER_STEP;
  #taskPresenter = new Map();
  #taskNewPresenter = null;
  #currentSortType = SortType.DEFAULT;
  #filterType = FilterType.ALL;
  #isLoading = true;

  constructor(boardContainer, tasksModel, filterModel) {
    this.#boardContainer = boardContainer;
    this.#tasksModel = tasksModel;
    this.#filterModel = filterModel;

    this.#taskNewPresenter = new TaskNewPresenter(this.#taskListComponent, this.#handleViewAction);
  }

  get tasks() {
    this.#filterType = this.#filterModel.filter;
    const tasks = this.#tasksModel.tasks;
    const filteredTasks = filter[this.#filterType](tasks);

    switch (this.#currentSortType) {
      case SortType.DATE_UP:
        return filteredTasks.sort(sortTaskUp);
      case SortType.DATE_DOWN:
        return filteredTasks.sort(sortTaskDown);
    }

    return filteredTasks;
  }

  init = () => {
    render(this.#boardContainer, this.#boardComponent, RenderPosition.BEFOREEND);
    render(this.#boardComponent, this.#taskListComponent, RenderPosition.BEFOREEND);

    this.#tasksModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#renderBoard();
  }

  destroy = () => {
    this.#clearBoard({resetRenderedTaskCount: true, resetSortType: true});

    remove(this.#taskListComponent);
    remove(this.#boardComponent);

    this.#tasksModel.removeObserver(this.#handleModelEvent);
    this.#filterModel.removeObserver(this.#handleModelEvent);
  }

  createTask = (callback) => {
    this.#currentSortType = SortType.DEFAULT;
    this.#taskNewPresenter.init(callback);
  }

  #handleModeChange = () => {
    this.#taskNewPresenter.destroy();
    this.#taskPresenter.forEach((presenter) => presenter.resetView());
  }

  #handleViewAction = async (actionType, updateType, update) => {
    // Здесь будем вызывать обновление модели.
    // actionType - действие пользователя, нужно чтобы понять, какой метод модели вызвать
    // updateType - тип изменений, нужно чтобы понять, что после нужно обновить
    // update - обновленные данные
    switch (actionType) {
      case UserAction.UPDATE_TASK:
        this.#taskPresenter.get(update.id).setViewState(TaskPresenterViewState.SAVING);
        try {
          await this.#tasksModel.updateTask(updateType, update);
        } catch(err) {
          this.#taskPresenter.get(update.id).setViewState(TaskPresenterViewState.ABORTING);
        }
        break;
      case UserAction.ADD_TASK:
        this.#taskNewPresenter.setSaving();
        try {
          await this.#tasksModel.addTask(updateType, update);
        } catch(err) {
          this.#taskNewPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_TASK:
        this.#taskPresenter.get(update.id).setViewState(TaskPresenterViewState.DELETING);
        try {
          await this.#tasksModel.deleteTask(updateType, update);
        } catch(err) {
          this.#taskPresenter.get(update.id).setViewState(TaskPresenterViewState.ABORTING);
        }
        break;
    }
  }

  #handleModelEvent = (updateType, data) => {
    // В зависимости от типа изменений решаем, что делать:
    switch (updateType) {
      case UpdateType.PATCH:
        // - обновить часть списка (например, когда поменялось описание)
        this.#taskPresenter.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        // - обновить список (например, когда задача ушла в архив)
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        // - обновить всю доску (например, при переключении фильтра)
        this.#clearBoard({resetRenderedTaskCount: true, resetSortType: true});
        this.#renderBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderBoard();
        break;
    }
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearBoard({resetRenderedTaskCount: true});
    this.#renderBoard();
  }

  #renderSort = () => {
    // Метод для рендеринга сортировки
    this.#sortComponent = new SortView(this.#currentSortType);
    this.#sortComponent.setSortTypeChangeHandler(this.#handleSortTypeChange);
    render(this.#boardComponent, this.#sortComponent, RenderPosition.AFTERBEGIN);
  }

  #renderLoading = () => {
    render(this.#boardComponent, this.#loadingComponent, RenderPosition.AFTERBEGIN);
  }

  #renderTask = (task) => {
    // Метод, куда уйдёт логика созданию и рендерингу компонетов задачи,
    // текущая функция renderTask в main.js
    const taskPresenter = new TaskPresenter(this.#taskListComponent, this.#handleViewAction, this.#handleModeChange);
    taskPresenter.init(task);
    this.#taskPresenter.set(task.id, taskPresenter);
  }

  #renderTasks = (tasks) => {
    tasks.forEach((task) => this.#renderTask(task));
  }

  #renderNoTasks = () => {
    this.#noTaskComponent = new NoTaskView(this.#filterType);
    // Метод для рендеринга заглушки
    render(this.#boardComponent, this.#noTaskComponent, RenderPosition.AFTERBEGIN);
  }

  #handleLoadMoreButtonClick = () => {
    const taskCount = this.tasks.length;
    const newRenderedTaskCount = Math.min(taskCount, this.#renderedTaskCount + TASK_COUNT_PER_STEP);
    const tasks = this.tasks.slice(this.#renderedTaskCount, newRenderedTaskCount);

    this.#renderTasks(tasks);
    this.#renderedTaskCount = newRenderedTaskCount;

    if (this.#renderedTaskCount >= taskCount) {
      remove(this.#loadMoreButtonComponent);
    }
  }

  #renderLoadMoreButton = () => {
    this.#loadMoreButtonComponent = new LoadMoreButtonView();
    this.#loadMoreButtonComponent.setClickHandler(this.#handleLoadMoreButtonClick);
    render(this.#boardComponent, this.#loadMoreButtonComponent, RenderPosition.BEFOREEND);
  }

  #clearBoard = ({resetRenderedTaskCount = false, resetSortType = false} = {}) => {
    const taskCount = this.tasks.length;

    this.#taskNewPresenter.destroy();
    this.#taskPresenter.forEach((presenter) => presenter.destroy());
    this.#taskPresenter.clear();

    remove(this.#sortComponent);
    remove(this.#loadingComponent);
    remove(this.#loadMoreButtonComponent);

    if (this.#noTaskComponent) {
      remove(this.#noTaskComponent);
    }

    if (resetRenderedTaskCount) {
      this.#renderedTaskCount = TASK_COUNT_PER_STEP;
    } else {
      // На случай, если перерисовка доски вызвана
      // уменьшением количества задач (например, удаление или перенос в архив)
      // нужно скорректировать число показанных задач
      this.#renderedTaskCount = Math.min(taskCount, this.#renderedTaskCount);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }
  }

  #renderBoard = () => {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    const tasks = this.tasks;
    const taskCount = tasks.length;

    if (taskCount === 0) {
      this.#renderNoTasks();
      return;
    }

    this.#renderSort();

    // Теперь, когда _renderBoard рендерит доску не только на старте,
    // но и по ходу работы приложения, нужно заменить
    // константу TASK_COUNT_PER_STEP на свойство _renderedTaskCount,
    // чтобы в случае перерисовки сохранить N-показанных карточек
    this.#renderTasks(tasks.slice(0, Math.min(taskCount, this.#renderedTaskCount)));

    if (taskCount > this.#renderedTaskCount) {
      this.#renderLoadMoreButton();
    }
  }
}
