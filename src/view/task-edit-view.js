import SmartView from './smart-view.js';
import {COLORS} from '../const.js';
import {isTaskRepeating, formatTaskDueDate} from '../utils/task.js';

const BLANK_TASK = {
  color: COLORS[0],
  description: '',
  dueDate: null,
  repeating: {
    mo: false,
    tu: false,
    we: false,
    th: false,
    fr: false,
    sa: false,
    su: false,
  },
  isArchive: false,
  isFavorite: false,
};

const createTaskEditDateTemplate = (dueDate, isDueDate) => (
  `<button class="card__date-deadline-toggle" type="button">
      date: <span class="card__date-status">${isDueDate ? 'yes' : 'no'}</span>
    </button>
    ${isDueDate ? `<fieldset class="card__date-deadline">
      <label class="card__input-deadline-wrap">
        <input
          class="card__date"
          type="text"
          placeholder=""
          name="date"
          value="${formatTaskDueDate(dueDate)}"
        />
      </label>
    </fieldset>` : ''}
  `
);

const createTaskEditRepeatingTemplate = (repeating, isRepeating) => (
  `<button class="card__repeat-toggle" type="button">
  repeat:<span class="card__repeat-status">${isRepeating ? 'yes' : 'no'}</span>
  </button>
  ${isRepeating ? `<fieldset class="card__repeat-days">
    <div class="card__repeat-days-inner">
      ${Object.entries(repeating).map(([day, repeat]) => `<input
        class="visually-hidden card__repeat-day-input"
        type="checkbox"
        id="repeat-${day}"
        name="repeat"
        value="${day}"
        ${repeat ? 'checked' : ''}
      />
      <label class="card__repeat-day" for="repeat-${day}"
        >${day}</label
      >`).join('')}
    </div>
  </fieldset>` : ''}`
);

const createTaskEditColorsTemplate = (currentColor) => (
  COLORS.map((color) => `<input
    type="radio"
    id="color-${color}"
    class="card__color-input card__color-input--${color} visually-hidden"
    name="color"
    value="${color}"
    ${currentColor === color ? 'checked' : ''}
  />
  <label
    for="color-${color}"
    class="card__color card__color--${color}"
    >${color}</label
  >`).join('')
);

export const createTaskEditTemplate = (data) => {
  const {color, description, dueDate, repeating, isDueDate, isRepeating} = data;

  const dateTemplate = createTaskEditDateTemplate(dueDate, isDueDate);

  const repeatingClassName = isRepeating
    ? 'card--repeat'
    : '';

  const repeatingTemplate = createTaskEditRepeatingTemplate(repeating, isRepeating);

  const colorsTemplate = createTaskEditColorsTemplate(color);

  const isSubmitDisabled = isRepeating && !isTaskRepeating(repeating);

  return `<article class="card card--edit card--${color} ${repeatingClassName}">
    <form class="card__form" method="get">
      <div class="card__inner">
        <div class="card__color-bar">
          <svg class="card__color-bar-wave" width="100%" height="10">
            <use xlink:href="#wave"></use>
          </svg>
        </div>

        <div class="card__textarea-wrap">
          <label>
            <textarea
              class="card__text"
              placeholder="Start typing your text here..."
              name="text"
            >${description}</textarea>
          </label>
        </div>

        <div class="card__settings">
          <div class="card__details">
            <div class="card__dates">
              ${dateTemplate}

              ${repeatingTemplate}
            </div>
          </div>
          <div class="card__colors-inner">
            <h3 class="card__colors-title">Color</h3>
            <div class="card__colors-wrap">
              ${colorsTemplate}
            </div>
          </div>
        </div>
        <div class="card__status-btns">
          <button class="card__save" type="submit" ${isSubmitDisabled ? 'disabled' : ''}>save</button>
          <button class="card__delete" type="button">delete</button>
        </div>
      </div>
    </form>
  </article>`;
};
export default class TaskEditView extends SmartView {
  #task = null;

  constructor(task = BLANK_TASK) {
    super();
    this._data = TaskEditView.parseTaskToData(task);
    this.#setInnerHandlers();
  }

  get template() {
    return createTaskEditTemplate(this._data);
  }

  setFormSubmitHandler = (callback) => {
    this._callback.formSubmit = callback;
    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);
  }

  reset = (task) => {
    this.updateData(
      TaskEditView.parseTaskToData(task),
    );
  }

  restoreHandlers = () => {
    this.#setInnerHandlers();
    this.setFormSubmitHandler(this._callback.formSubmit);
  }

  #setInnerHandlers = () => {
    this.element.querySelector('.card__date-deadline-toggle')
      .addEventListener('click', this.#dueDateToggleHandler);
    this.element.querySelector('.card__repeat-toggle')
      .addEventListener('click', this.#repeatingToggleHandler);
    this.element.querySelector('.card__text')
      .addEventListener('input', this.#descriptionInputHandler);
    if (this._data.isRepeating) {
      this.element.querySelector('.card__repeat-days-inner')
        .addEventListener('change', this.#repeatingChangeHandler);
    }

    this.element.querySelector('.card__colors-wrap')
      .addEventListener('change', this.#colorChangeHandler);
  }

  #dueDateToggleHandler = (evt) => {
    evt.preventDefault();
    this.updateData({
      isDueDate: !this._data.isDueDate,
      // Логика следующая: если выбор даты нужно показать,
      // то есть когда "!this._data.isDueDate === true",
      // тогда isRepeating должно быть строго false.
      isRepeating: !this._data.isDueDate ? false : this._data.isRepeating,
    });
  }

  #descriptionInputHandler = (evt) => {
    evt.preventDefault();
    this.updateData({
      description: evt.target.value,
    }, true);
  }

  #repeatingToggleHandler = (evt) => {
    evt.preventDefault();
    this.updateData({
      isRepeating: !this._data.isRepeating,
      // Аналогично, но наоборот, для повторения
      isDueDate: !this._data.isRepeating ? false : this._data.isDueDate,
    });
  }

  #repeatingChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateData({
      repeating: {...this._data.repeating, [evt.target.value]: evt.target.checked},
    });
  }

  #colorChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateData({
      color: evt.target.value,
    });
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this._callback.formSubmit(TaskEditView.parseDataToTask(this._data));
  }

  static parseTaskToData = (task) => ({...task,
    isDueDate: task.dueDate !== null,
    isRepeating: isTaskRepeating(task.repeating),
  });

  static parseDataToTask = (data) => {
    const task = {...data};

    if (!task.isDueDate) {
      task.dueDate = null;
    }

    if (!task.isRepeating) {
      task.repeating = {
        mo: false,
        tu: false,
        we: false,
        th: false,
        fr: false,
        sa: false,
        su: false,
      };
    }

    delete task.isDueDate;
    delete task.isRepeating;

    return task;
  }
}
