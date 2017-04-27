HTML Webpack Plugin
===================

[![NPM](https://nodei.co/npm/yamasters-backendtree-webpack-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/yamasters-backendtree-webpack-plugin/)

This is a [webpack](http://webpack.github.io/) plugin that simplifies creation
of development files for [Yamasters](https://yamasters.com/en/) backend team.
This plugin creates *.php files with auto includes.

Maintainer: vtlk [@vtlk7](http://telegram.me/vtlk7)

Installation
------------
Install the plugin with npm:
```shell
$ npm install yamasters-backendtree-webpack-plugin --save-dev
```

Important
---------
This plugin works `only` in pair with [html-component-loader](https://www.npmjs.com/package/html-component-loader).

Basic Usage
-----------

The plugin will generate an HTML5 file for you that includes all your webpack
bundles in the body using `script` tags. Just add the plugin to your webpack
config as follows:

```javascript
var YamastersBackendtree = require('yamasters-backendtree-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'dist',
    filename: 'index_bundle.js'
  },
  plugins: [new YamastersBackendtree({
	  from: path.resolve(__dirname, 'dist'),
	  to: path.resolve(__dirname, 'php')
  })]
};
```

This will generate a file `php/index.php` containing the following:
```html
<!DOCTYPE html>
<html>
  <head>
    <? include '/includes/head.php'; ?>
  </head>
  <body>
    <? include '/includes/blocks/someblock.php'; ?>
    <script src="index_bundle.js"></script>
  </body>
</html>
```

Configuration
-------------
Allowed values are as follows:

- `from`: Dist directory, that contains generated html files and bundles.
- `to`: Directory for `.php` files. Bundles will be copied from dist.


# License

This project is licensed under [MIT](https://github.com/jantimon/html-webpack-plugin/blob/master/LICENSE).
