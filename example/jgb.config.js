module.exports = {
  entryFiles: ['app.ts', 'app.wxss', 'app.json'],
  alias: {
    '@jgbjs/tracker': "../src/"
  },
  presets: ['weapp'],
  plugins: [
    ['less', {
      extensions: ['.wxss'],
      outExt: '.wxss'
    }], 'typescript'
  ]
}
