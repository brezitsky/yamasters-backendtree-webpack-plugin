const fse = require('fs-extra')
const fs = require('fs')
const path = require('path')
const pretty = require('pretty')

function YamastersBackendtree(options) {
	this.options = options;
}

YamastersBackendtree.prototype.apply = function(compiler) {
	// let _this = this;

	compiler.plugin('done', () => {
		console.log('\n--------------------------------------------');

		try {
			let dist = fse.readdirSync(this.options.from);
			// console.log(dist);

			let level2Paths = [];

			// перебираєм папку з побудованим проектом (тут ми шукаєм штмл-файли,які містяться в корні білда)
			dist.forEach(item => {
				let itemPathFrom = path.resolve(this.options.from, item);
				let itemPathTo = path.resolve(this.options.to, item)

				let stats = fs.statSync(itemPathFrom);

				// якщо папка - то просто копіюємо її рекурсивно
				if(stats.isDirectory()) {
					fse.copySync(itemPathFrom, itemPathTo)
				}

				// якщо файл, то починаєм з ним працювати
				if(stats.isFile()) {
					// console.log(itemPathTo);

					// копіюєм штмл-файл у файл пхп
					fse.copySync(itemPathFrom, itemPathTo.replace(/\.html$/, '.php'))

					// читаєм новостворений файл
					let file = fse.readFileSync(itemPathTo.replace(/\.html$/, '.php')).toString();

					let timeStamps = file.match(/<!-- #TIME=\d*# -->/g);


					timeStamps.map(stamp => {
						// console.log(stamp);
						let time = stamp.replace('<!-- #TIME=', '');
						time = time.replace('# -->', '');

						let regexp = new RegExp(`<!--#BEGIN-${time}#-->([\\s\\S]*?)<!--#END-${time}#-->`, 'g')

						// шукаєм блоки імпортованих файлів
						// let blocks = file.match(/<!--#BEGIN-\d*#-->([\s\S]*?)<!--#END-\d*#-->/g);
						let blocks = file.match(regexp);
						// console.log(blocks);

						// перебираєм всі блоки імпорту на сторінці
						if(blocks.length) {

							blocks.forEach(block => {

								// в кожному блоці імпорту шукаєм назву файла, який інклудиться
								let way = block.match(/<!--\s\/includes\/.*\.html\s-->/g);
								// console.log(way);


								// все гуд
								if(way.length) {
									let p = way[0].replace('<!-- ', '');
									p = p.replace(' -->', '');
									// let content = fs.readFileSync(path.join(this.options.from, p));
									p = p.replace(/\.html$/, '.php');

									/*
									замінюєм коменти першого рівня на пусті рядки, щоб можна було
									відокремити всередині кожного інклуда ще інклуди
									*/
									block = block.replace(new RegExp(`<!--#BEGIN-${time}#-->`, 'g'), '');
									block = block.replace(new RegExp(way[0], 'g'), '');
									block = block.replace(new RegExp(`<!-- #TIME=${time}# -->`, 'g'), '');
									block = block.replace(new RegExp(`<!--#END-${time}#-->`, 'g'), '');

									block = block.replace(/url\("img\//g, 'url("<?=SITE_TEMPLATE_PATH?>/img/');
									block = block.replace(/url\('img\//g, "url('<?=SITE_TEMPLATE_PATH?>/img/");

									if(way[1]) {
										level2Paths.push(p);
									}
									// console.log(path.join(this.options.to, p), path.normalize(this.options.to, p));
									fse.outputFileSync(path.join(this.options.to, p), block);
								}
								// не гуд
								else {
									console.log(`Error, path array length: ${way.length}`);
								}
							})
						}
					})
				}
			})

			fse.copySync(`${__dirname}/YamFront.php`, path.resolve(this.options.to, 'includes/lib/YamFront.php'));

			fs.writeFileSync(path.resolve(this.options.to, 'includes/head.php'), '<? include "lib/YamFront.php"; ?>', {flag: 'a'});

			let phpDir = fse.readdirSync(this.options.to);

			// console.log('\n');
			const _this = this;

			// перебираєм папку з пхп файлами
			phpDir.forEach(item => {
				php(item);
			})

			level2Paths.forEach(item => {
				php(item);
			})

			function php(item) {
				let url = _this.options.to + '/' + item;
				// console.log(url);

				let stats = fse.statSync(url);

				// якщо файл, то
				if(stats.isFile()) {
					// console.log(url);

					// читаєм файл
					let content = fse.readFileSync(url).toString();

					function convertPath(str, p1, offset, s) {
						let p = p1.replace(/\.html$/, '.php');
						p = p.replace('/includes', 'includes');
						return `<? $APPLICATION->YamFront->phpInclude('${p}'); ?>`;
					}

					let timeStamps = content.match(/<!-- #TIME=\d*# -->/g);

					timeStamps.map(stamp => {
						// console.log(stamp);
						let time = stamp.replace('<!-- #TIME=', '');
						time = time.replace('# -->', '');

						// console.log(time);

						// замінюєм блок штмл імпорта на пхп-шний інклуд
						// файл, який інклудиться, повинен автоматично згенеруватись у попередньому циклі

						let regexp = new RegExp(`<!--#BEGIN-${time}#-->\\s<!--\\s(.+)\\s-->\\s[\\s\\S]*?<!--#END-${time}#-->`, 'g')
						// console.log(regexp);
						// content = content.replace(/<!--#BEGIN-#-->\s<!--\s(.+)\s-->\s[\s\S]*?<!--#END#-->/g, convertPath);
						content = content.replace(regexp, convertPath);

					})



					// замінюєм блок штмл імпорта на пхп-шний інклуд
					// файл, який інклудиться, повинен автоматично згенеруватись у попередньому циклі
					// content = content.replace(/<!--#BEGIN#-->\s<!--\s(.+)\s-->\s[\s\S]*?<!--#END#-->/g, convertPath);

					// форматуєм вихідний код гарненько
					content = pretty(content, {
						// unformatted: ['code', 'pre', 'em', 'strong', 'span'],
						indent_inner_html: true,
						indent_char: '\t',
						indent_size: 1,
						sep: '\n'
					})
					// console.log(content);

					// пишем у файл
					fse.writeFileSync(url, content);

					// готово ;)
					console.log(`File ${url} done!`);
				}
				console.log('\n');
			}

			console.log(level2Paths);
		}
		catch(e) {
			console.error(e);
		}


		console.log('\n--------------------------------------------');
	});
};

module.exports = YamastersBackendtree;
