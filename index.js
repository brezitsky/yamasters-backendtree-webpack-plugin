const fs = require('fs-extra')
const path = require('path')
const pretty = require('pretty')

function YamastersBackendtree(options) {
	this.options = options;
}

YamastersBackendtree.prototype.apply = function(compiler) {
	// let _this = this;

	compiler.plugin('done', () => {
		console.log('\n\n\n\n\n--------------------------------------------');

		try {
			let dist = fs.readdirSync(this.options.from);
			// console.log(dist);

			dist.forEach(item => {
				let itemPathFrom = path.resolve(this.options.from, item);
				let itemPathTo = path.resolve(this.options.to, item)

				let stats = fs.statSync(itemPathFrom);

				if(stats.isDirectory()) {
					fs.copySync(itemPathFrom, itemPathTo)
				}
				if(stats.isFile()) {
					// console.log(itemPathTo);
					fs.copySync(itemPathFrom, itemPathTo.replace(/\.html$/, '.php'))

					let file = fs.readFileSync(itemPathTo.replace(/\.html$/, '.php')).toString();

					let blocks = file.match(/<!--#BEGIN#-->([\s\S]*?)<!--#END#-->/g);
					// console.log(blocks);

					if(blocks.length) {
						blocks.forEach(block => {
							let paths = file.match(/<!--\s([\s\S]*?)\s-->/g);

							if(paths.length) {
								paths.forEach(p => {
									p = p.replace('<!-- ', '');
									p = p.replace(' -->', '');
									p = p.replace(/\.html$/, '.php')
									// console.log(block);

									fs.outputFileSync(path.join(this.options.to, p), block)
								})
							}
						})
					}
				}
			})

			let phpDir = fs.readdirSync(this.options.to);

			console.log('\n');
			phpDir.forEach(item => {
				let url = path.resolve(this.options.to, item)

				let stats = fs.statSync(url);

				if(stats.isFile()) {
					// console.log(url);
					let content = fs.readFileSync(url).toString();

					function convertPath(str, p1, offset, s) {
						return `<? include '${p1.replace(/\.html$/, '.php')}'; ?>`;
					}

					content = content.replace(/<!--#BEGIN#-->\s<!--\s(.+)\s-->\s[\s\S]*?<!--#END#-->/g, convertPath);
					// content = content.replace(/></g, '>\n<');
					// content = content.replace(/>\s<\/script>/g, '><\/script>')
					content = pretty(content, {
						unformatted: ['code', 'pre', 'em', 'strong', 'span'],
						indent_inner_html: true,
						indent_char: '\t',
						indent_size: 1,
						sep: '\n'
					})
					
					fs.writeFileSync(url, content);
					console.log(`File ${url} done!`);
				}
				console.log('\n');
			})
		}
		catch(e) {
			console.error(e);
		}


		console.log('\n\n\n\n\n--------------------------------------------');
	});
};

module.exports = YamastersBackendtree;
