//
// scriptable 加载器
// 用于加载远程 scriptable 桌面组件插件
// author@im3x
// 公众号@古人云
// https://github.com/im3x/Scriptables
//

class Im3xLoader {
  constructor (git = 'github') {
    // 仓库源
    this.git = git
    // 解析参数
    this.opt = {
      name: 'welcome',
      args: '',
      version: 'latest'
    }
    if (args.widgetParameter) {
      let _args = args.widgetParameter.split(":")
      let _plug = _args[0].split("@")
      if (_plug.length === 2) {
        this.opt['version'] = _plug[1]
      }
      this.opt['name'] = _plug[0]
      if (_args.length === 2) this.opt['args'] = _args[1]
    }
    // 缓存路径
    this.filename = `${this.opt['name']}@${this.opt['version']}.js.im3x`
    this.filepath = FileManager.local().documentsDirectory() + '/' + this.filename
    this.notify()
  }

  async init () {
    // 判断文件是否存在
    let rendered = false
    let widget
    if (FileManager.local().fileExists(this.filepath)) {
      try {
        widget = await this.render()
        rendered = true
      } catch(e){}
    }
    // 加载代码，存储
    let req = new Request(`https://${this.git}.com/im3x/Scriptables/raw/main/${encodeURIComponent(this.opt['name'])}/${this.opt['version']}.js?_=${+new Date}`)
    let res = await req.loadString()
    // 如果404
    if (req.response['statusCode'] === 404) {
      widget = await this.render404()
    } else {
      await FileManager.local().writeString(this.filepath, res)
      if (!rendered) {
        widget = this.render()
      }
    }

    return widget

  }
  async render404 () {
    let m = new ListWidget()
    let t1 = m.addText("⚠️")
    t1.centerAlignText()
    m.addSpacer(10)
    let t = m.addText("404")
    t.textColor = Color.red()
    t.centerAlignText()
    m.url = 'https://github.com/im3x/Scriptables'
    return m
  }
  async render () {
    let M = importModule(this.filename)
    let m = new M(this.opt['args'])
    let w = await m.render()
    return w
  }
  
  async notify () {
    let req = new Request(`https://${this.git}.com/im3x/Scriptables/raw/main/update.notify.json`)
    let res = await req.loadJSON()
    if (!res || !res['id']) return
    // 判断是否已经通知过
    let key = `im3x_notify_${res['id']}`
    if (Keychain.get(key) === 'ok') return
    // 通知
    let n = new Notification()
    n = Object.assign(n, res)
    n.schedule()
    // 设置已通知
    Keychain.set(key, 'ok')
  }
}
const Loader = new Im3xLoader()
const widget = await Loader.init()
if (!config.runsInWidget) {
  await widget.presentSmall()
} else {
  Script.setWidget(widget)
}
Script.complete()
