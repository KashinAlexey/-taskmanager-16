import SiteMenuView from './view/site-menu-view.js';
import FilterView from './view/filter-view.js';
import TaskView from './view/task-view.js';
import TaskEditView from './view/task-edit-view.js';
import LoadMoreButtonView from './view/load-more-button-view.js';
import BoardView from './view/board-view.js';
import SortView from './view/sort-view.js';
import TaskListView from './view/task-list-view.js';
import {renderElement, RenderPosition} from './render.js';
import {generateTask} from './mock/task.js';
import {generateFilter} from './mock/filter.js';

const TASK_COUNT = 22;
const TASK_COUNT_PER_STEP = 8;

const tasks = Array.from({length: TASK_COUNT}, generateTask);
const filters = generateFilter(tasks);

const siteMainElement = document.querySelector('.main');
const siteHeaderElement = siteMainElement.querySelector('.main__control');

renderElement(siteHeaderElement, new SiteMenuView().element, RenderPosition.BEFOREEND);
renderElement(siteMainElement, new FilterView(filters).element, RenderPosition.BEFOREEND);

const boardComponent = new BoardView();
renderElement(siteMainElement, boardComponent.element, RenderPosition.BEFOREEND);
renderElement(boardComponent.element, new SortView().element, RenderPosition.AFTERBEGIN);

const taskListComponent = new TaskListView();
renderElement(boardComponent.element, taskListComponent.element, RenderPosition.BEFOREEND);
renderElement(taskListComponent.element, new TaskEditView(tasks[0]).element, RenderPosition.BEFOREEND);

for (let i = 1; i < Math.min(tasks.length, TASK_COUNT_PER_STEP); i++) {
  renderElement(taskListComponent.element, new TaskView(tasks[i]).element, RenderPosition.BEFOREEND);
}

if (tasks.length > TASK_COUNT_PER_STEP) {
  let renderedTaskCount = TASK_COUNT_PER_STEP;

  const loadMoreButtonComponent = new LoadMoreButtonView();

  renderElement(boardComponent.element, loadMoreButtonComponent.element, RenderPosition.BEFOREEND);

  loadMoreButtonComponent.element.addEventListener('click', (evt) => {
    evt.preventDefault();

    tasks
      .slice(renderedTaskCount, renderedTaskCount + TASK_COUNT_PER_STEP)
      .forEach((task) => renderElement(taskListComponent.element, new TaskView(task).element, RenderPosition.BEFOREEND));

    renderedTaskCount += TASK_COUNT_PER_STEP;

    if (renderedTaskCount >= tasks.length) {
      loadMoreButtonComponent.element.remove();
      loadMoreButtonComponent.removeElement();
    }
  });
}
