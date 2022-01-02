import SiteMenuView from './view/site-menu-view.js';
import {render, RenderPosition, remove} from './utils/render.js';
import FilterPresenter from './presenter/filter-presenter.js';
import BoardPresenter from './presenter/board-presenter.js';
import TasksModel from './model/tasks-model.js';
import FilterModel from './model/filter-model.js';
import {MenuItem} from './const.js';
import StatisticsView from './view/statistics-view.js';
import ApiService from './api-service.js';

const AUTHORIZATION = 'Basic luhqwiuhfwheohv9653';
const END_POINT = 'https://16.ecmascript.pages.academy/task-manager';

const siteMainElement = document.querySelector('.main');
const siteHeaderElement = siteMainElement.querySelector('.main__control');

const tasksModel = new TasksModel(new ApiService(END_POINT, AUTHORIZATION));

const filterModel = new FilterModel();

const siteMenuComponent = new SiteMenuView();

const boardPresenter = new BoardPresenter(siteMainElement, tasksModel, filterModel);
const filterPresenter = new FilterPresenter(siteMainElement, filterModel, tasksModel);

const handleTaskNewFormClose = () => {
  siteMenuComponent.element.querySelector(`[value=${MenuItem.TASKS}]`).disabled = false;
  siteMenuComponent.element.querySelector(`[value=${MenuItem.STATISTICS}]`).disabled = false;
  siteMenuComponent.setMenuItem(MenuItem.TASKS);
};

let statisticsComponent = null;

const handleSiteMenuClick = (menuItem) => {
  switch (menuItem) {
    case MenuItem.ADD_NEW_TASK:
      // Скрыть статистику
      remove(statisticsComponent);
      // Показать фильтры
      filterPresenter.destroy();
      filterPresenter.init();
      // Показать доску
      boardPresenter.destroy();
      boardPresenter.init();
      // Показать форму добавления новой задачи
      boardPresenter.createTask(handleTaskNewFormClose);
      // Убрать выделение с других пунктов меню
      siteMenuComponent.element.querySelector(`[value=${MenuItem.TASKS}]`).disabled = true;
      siteMenuComponent.element.querySelector(`[value=${MenuItem.STATISTICS}]`).disabled = true;
      // Убрать выделение с ADD NEW TASK после сохранения
      break;
    case MenuItem.TASKS:
      // Показать фильтры
      filterPresenter.init();
      // Показать доску
      boardPresenter.init();
      // Скрыть статистику
      remove(statisticsComponent);
      break;
    case MenuItem.STATISTICS:
      // Скрыть фильтры
      filterPresenter.destroy();
      // Скрыть доску
      boardPresenter.destroy();
      // Показать статистику
      statisticsComponent = new StatisticsView(tasksModel.tasks);
      render(siteMainElement, statisticsComponent, RenderPosition.BEFOREEND);
      break;
  }
};

siteMenuComponent.setMenuClickHandler(handleSiteMenuClick);
render(siteHeaderElement, siteMenuComponent, RenderPosition.BEFOREEND);

filterPresenter.init();
boardPresenter.init();
tasksModel.init();

document.querySelector('#control__new-task').addEventListener('click', (evt) => {
  evt.preventDefault();
  boardPresenter.createTask();
});
