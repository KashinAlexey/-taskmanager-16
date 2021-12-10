import dayjs from 'dayjs'; // Пакет для работы с датой
import {nanoid} from 'nanoid';
import {COLORS} from '../const.js';
import {getRandomInteger} from '../utils/common.js';


const generateDescription = () => {
  const descriptions = [
    'Изучить теорию',
    'Сделать домашку',
    'Пройти интенсив на соточку',
  ];

  const randomIndex = getRandomInteger(0, descriptions.length - 1);

  return descriptions[randomIndex];
};

const generateBoolean = () => Boolean(getRandomInteger(0, 1));

const generateDate = () => {
  const isDate = generateBoolean();

  if (!isDate) {
    return null;
  }

  const maxDaysGap = 7;
  const daysGap = getRandomInteger(-maxDaysGap, maxDaysGap);

  return dayjs().add(daysGap, 'day').toDate();
};

const generateRepeating = () => ({
  mo: false,
  tu: false,
  we: generateBoolean(),
  th: false,
  fr: generateBoolean(),
  sa: false,
  su: false,
});

const getRandomColor = () => {
  const randomIndex = getRandomInteger(0, COLORS.length - 1);

  return COLORS[randomIndex];
};

export const generateTask = () => {
  const dueDate = generateDate();
  const repeating = dueDate === null
    ? generateRepeating()
    : {
      mo: false,
      tu: false,
      we: false,
      th: false,
      fr: false,
      sa: false,
      su: false,
    };

  return {
    id: nanoid(),
    description: generateDescription(),
    dueDate,
    repeating,
    color: getRandomColor(),
    isArchive: generateBoolean(),
    isFavorite: generateBoolean(),
  };
};
