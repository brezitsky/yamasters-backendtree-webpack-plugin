const fs = require('fs-extra')
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
			let dist = fs.readdirSync(this.options.from);
			// console.log(dist);


			// перебираєм папку з побудованим проектом (тут ми шукаєм штмл-файли,які містяться в корні білда)
			dist.forEach(item => {
				let itemPathFrom = path.resolve(this.options.from, item);
				let itemPathTo = path.resolve(this.options.to, item)

				let stats = fs.statSync(itemPathFrom);

				// якщо папка - то просто копіюємо її рекурсивно
				if(stats.isDirectory()) {
					fs.copySync(itemPathFrom, itemPathTo)
				}

				// якщо файл, то починаєм з ним працювати
				if(stats.isFile()) {
					// console.log(itemPathTo);

					// копіюєм штмл-файл у файл пхп
					fs.copySync(itemPathFrom, itemPathTo.replace(/\.html$/, '.php'))

					// читаєм новостворений файл
					let file = fs.readFileSync(itemPathTo.replace(/\.html$/, '.php')).toString();

					// шукаєм блоки імпортованих файлів
					let blocks = file.match(/<!--#BEGIN#-->([\s\S]*?)<!--#END#-->/g);
					// console.log(blocks);

					// перебираєм всі блоки імпорту на сторінці
					if(blocks.length) {

						blocks.forEach(block => {

							// в кожному блоці імпорту шукаєм назву файла, який інклудиться
							let way = block.match(/<!--\s([\s\S]*?)\s-->/g);
							// console.log(typeof way, way);

							// way - це масив. Якщо в ньому більш ніж 1 елемент, то
							// щось пішло не так

							// все гуд
							/*if(way.length === 1) {*/
								let p = way[0].replace('<!-- ', '');
								p = p.replace(' -->', '');
								// let content = fs.readFileSync(path.join(this.options.from, p));
								p = p.replace(/\.html$/, '.php');

								// console.log(path.join(this.options.to, p), path.normalize(this.options.to, p));
								fs.outputFileSync(path.join(this.options.to, p), block);
							}
							/*// не гуд
							else {
								console.log(`Error, path array length: ${path.length}`);
							}*/
						})
					}
				}
			})

			let phpDir = fs.readdirSync(this.options.to);

			// console.log('\n');

			// перебираєм папку з пхп файлами
			phpDir.forEach(item => {
				let url = path.resolve(this.options.to, item)

				let stats = fs.statSync(url);

				// якщо файл, то
				if(stats.isFile()) {
					// console.log(url);

					// читаєм файл
					let content = fs.readFileSync(url).toString();

					function convertPath(str, p1, offset, s) {
						let p = p1.replace(/\.html$/, '.php');
						p = p.replace('/includes', 'includes');
						return `<? include '${p}'; ?>`;
					}

					// замінюєм блок штмл імпорта на пхп-шний інклуд
					// файл, який інклудиться, повинен автоматично згенеруватись у попередньому циклі
					content = content.replace(/<!--#BEGIN#-->\s<!--\s(.+)\s-->\s[\s\S]*?<!--#END#-->/g, convertPath);

					// форматуєм вихідний код гарненько
					content = pretty(content, {
						unformatted: ['code', 'pre', 'em', 'strong', 'span'],
						indent_inner_html: true,
						indent_char: '\t',
						indent_size: 1,
						sep: '\n'
					})

					// пишем у файл
					fs.writeFileSync(url, content);

					// готово ;)
					console.log(`File ${url} done!`);
				}
				console.log('\n');
			})
		}
		catch(e) {
			console.error(e);
		}


		console.log('\n--------------------------------------------');
	});
};

module.exports = YamastersBackendtree;
