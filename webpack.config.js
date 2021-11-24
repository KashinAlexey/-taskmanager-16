const path = require('path'); // Подключаем встроенный Node.js модуль path

module.exports = {
  entry: './src/main.js', // указываем путь до входной точки
  output: { // описываем куда следует поместить результат работы
    filename: 'bundle.js', // имя файла со сборкой
    path: path.resolve(__dirname, 'public'), // путь до директории куда поместить этот файл (важно использовать path.resolve)
  },
  devtool: 'source-map' // подключение карты исходного кода. для удобства правки кода после его сборки в  один файл
};
