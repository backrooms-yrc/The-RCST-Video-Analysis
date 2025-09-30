(function(){
  const input = document.getElementById('input-url');
  const playBtn = document.getElementById('play-btn');
  const video = document.getElementById('html5-video');
  const iframe = document.getElementById('parser-iframe');
  const meta = document.getElementById('meta');
  const parserSelect = document.getElementById('parser-select');
  const quickParsers = document.getElementById('quick-parsers');

  // 🔗 解析接口（只要在这里加就会自动出现在前端）
  const parsers = [
    { name: "接口1（高清稳定，首选）", url: "https://jx.xmflv.com/?url=%s" },
    { name: "【可直接搜索片名】接口2（本站自建，有点卡）", url: "https://z1.m1907.top/?jx=%s" },
    { name: "聚合解析3（自动选择最优线路）", url: "https://www.yemu.xyz/?url=%s" },
    { name: "臻享视听4（免费1080P，付费4K HDR/臻享视听）", url: "https://aibox.eu.org/?url=%s" },
    // { name: "接口名称", url: "https://xxx.com/?url=%s" }
  ];

  // 填充 select 和快速选择
  parsers.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.url; opt.textContent = "解析器：" + p.name;
    parserSelect.appendChild(opt);

    const btn = document.createElement("button");
    btn.textContent = p.name; btn.dataset.url = p.url;
    quickParsers.appendChild(btn);
  });

  // 初始化 Plyr
  try { new Plyr(video); } catch(e){}

  // 模式切换
  const modePlay = document.getElementById('mode-play');
  const modeIframe = document.getElementById('mode-iframe');
  let mode = 'play';
  function setMode(m){
    mode = m;
    modePlay.classList.toggle('active', m==='play');
    modeIframe.classList.toggle('active', m==='iframe');
    video.style.display = (m==='play') ? 'block' : 'none';
    iframe.style.display = (m==='iframe') ? 'block' : 'none';
  }
  modePlay.addEventListener('click', ()=> setMode('play'));
  modeIframe.addEventListener('click', ()=> setMode('iframe'));

  // 快速选择按钮
  quickParsers.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-url]');
    if(!btn) return;
    parserSelect.value = btn.dataset.url;
  });

  // 判断是否 m3u8
  function isM3U8(str){
    return /\.m3u8(\?|$)/i.test(str) || (str.startsWith('http') && str.includes('m3u8'));
  }

  // 播放逻辑
  function play(){
    const val = input.value.trim();
    if(!val){ meta.textContent = '状态指示：请输入链接或片名'; return; }

    if(mode==='play' && isM3U8(val)){
      meta.textContent = '状态指示：直接播放 m3u8...';
      if(window._hls){ try{ window._hls.destroy(); }catch(e){} }
      if(video.canPlayType('application/vnd.apple.mpegurl')){
        video.src = val; video.play().catch(()=>{});
      } else if(Hls.isSupported()){
        const hls = new Hls(); window._hls = hls;
        hls.loadSource(val); hls.attachMedia(video);
      } else {
        meta.textContent = '状态指示：浏览器不支持 m3u8';
      }
      setMode('play');
    } else {
      meta.textContent = '状态指示：正在使用解析器加载播放窗口，请稍候...';
      const parser = parserSelect.value || parsers[0].url;
      iframe.src = parser.replace('%s', encodeURIComponent(val));
      setMode('iframe');
    }
  }

  playBtn.addEventListener('click', play);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') play(); });
  iframe.addEventListener('load', ()=> meta.textContent='状态指示：iframe解析器播放窗口 已加载完成！');
})();

  // 自动弹窗公告
window.addEventListener("load", () => {
  const modal = document.getElementById("announcement-modal");
  const okBtn = document.getElementById("modal-ok");

  if (modal && okBtn) {
    // 打开
    modal.classList.add("show");

    // 关闭
    okBtn.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }
});