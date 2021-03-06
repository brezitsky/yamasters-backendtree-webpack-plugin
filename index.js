const fse = require('fs-extra')
const fs = require('fs')
const path = require('path')
const pretty = require('pretty')

function BackendTree27(options) {
	this.options = options;
}

BackendTree27.prototype.apply = function(compiler) {
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

									block = block.replace(/url\("img\//g, 	'url("<?=RESOURCE_PATH?>img/');
									block = block.replace(/url\('img\//g, 	"url('<?=RESOURCE_PATH?>img/");
									block = block.replace(/url\(img\//g, 	"url(<?=RESOURCE_PATH?>img/");
									block = block.replace(/src="img\//g, 	'src="<?=RESOURCE_PATH?>img/');
									block = block.replace(/src='img\//g, 	"src='<?=RESOURCE_PATH?>img/");
									block = block.replace(/src="video\//g, 	'src="<?=RESOURCE_PATH?>video/');
									block = block.replace(/src='video\//g, 	"src='<?=RESOURCE_PATH?>video/");
									block = block.replace(/xlink:href="img/g, 'xlink:href="<?=RESOURCE_PATH?>img');
									block = block.replace(/xlink:href='img/g, "xlink:href='<?=RESOURCE_PATH?>img");

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
						return `<include><? require(REQUIRE_PATH.'${p}'); ?></include>`;
					}

					let timeStamps = content.match(/<!-- #TIME=\d*# -->/g);

					if(timeStamps) {
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
					}

					// замінюєм блок штмл імпорта на пхп-шний інклуд
					// файл, який інклудиться, повинен автоматично згенеруватись у попередньому циклі
					// content = content.replace(/<!--#BEGIN#-->\s<!--\s(.+)\s-->\s[\s\S]*?<!--#END#-->/g, convertPath);


					// console.log(content);

					// console.log(file);
					content = content.replace(/href="bundles\//g, 'href="<?=RESOURCE_PATH?>bundles/');
					content = content.replace(/src="bundles\//g, 'src="<?=RESOURCE_PATH?>bundles/');
					content = content.replace(/\$APPLICATION->YamFront->phpInclude\('\/includes\/head\.php'\)/g, "require(REQUIRE_PATH.'includes/head.php')");

					content = content.replace(
						'<link href="<?=RESOURCE_PATH?>bundles/commons.css" rel="stylesheet">',
						''
					);

					let templateStylesFile = '';

					content = content.replace(
						/\<link href\=\"\<\?\=RESOURCE_PATH\?\>bundles\/(.*)\.css\" rel\=\"stylesheet\"\>/g,
						function(str, p1, offset, s) {
							templateStylesFile = str;
							return '';
						}
					);

					templateStylesFile = templateStylesFile.replace('<link', '<link onload="window.incrementResourceCounter()"');

					/*<link href="<?=RESOURCE_PATH?>bundles/inline.css" rel="stylesheet">\n*/
					content = content.replace(
						/<script type="text\/javascript" src="<\?=RESOURCE_PATH\?>bundles\/commons\.js"><\/script>/g,
						`<link onload="window.incrementResourceCounter()" href="<?=RESOURCE_PATH?>bundles/commons.css" rel="stylesheet">\n` +
						templateStylesFile + `\n
						<script type="text/javascript" src="<?=RESOURCE_PATH?>bundles/commons.js"></script>\n
						<script type="text/javascript" src="<?=RESOURCE_PATH?>bundles/inline.js"></script>`
					)

					content = content.replace(
						/<script type="text\/javascript" src/g,
						'<script defer type="text\/javascript" src'
					)

					// content = content.replace(
					// 	'</body>',
					// 	"<script>document.getElementById('body').classList.add('loaded')</script>\n</body>"
					// )

					// форматуєм вихідний код гарненько
					content = pretty(content, {
						indent_inner_html: false,
						indent_char: '\t',
						indent_size: 1,
						sep: '\n',
						ocd: true
					})

					try {
						content = content.replace(/<\/?include>/g,'');
					}
					catch(e) {
						console.log(e);
					}

					if(_this.options.mode === 'denwer') {
						// пишем у файл
						fse.writeFileSync(url, `<?\n\tdefine("RESOURCE_PATH", "");\n\tdefine("REQUIRE_PATH", "");\n?>\n${content}`);
					}
					else if (_this.options.mode === 'production') {
						// пишем у файл
						fse.writeFileSync(url, `<?\n\trequire($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");\n\tdefine("RESOURCE_PATH", SITE_TEMPLATE_PATH."/new-front/");\n\tdefine("REQUIRE_PATH", $_SERVER["DOCUMENT_ROOT"].SITE_TEMPLATE_PATH."/new-front/");\n?>\n${content}`);
					}

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

module.exports = BackendTree27;
