let data = null;
let numColumns = [];
let selectedNumCol = null;
let chartInstance = null;

// 页面切换
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
  const names = { dashboard:'工作台', data:'数据管理', stats:'统计分析', chart:'图表生成', code:'代码生成', about:'关于' };
  document.getElementById('breadcrumb').textContent = names[page];
  if (page === 'chart' && chartInstance) setTimeout(() => chartInstance.resize(), 100);
  // 手机端切换页面后收起侧边栏
  document.getElementById('sidebar').classList.remove('open');
}

// 切换侧边栏（手机端）
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// 上传文件
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
uploadZone.onclick = () => fileInput.click();
uploadZone.ondragover = (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); };
uploadZone.ondragleave = () => uploadZone.classList.remove('dragover');
uploadZone.ondrop = (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
};
fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

function handleFile(file) {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      data = results.data.filter(r => Object.values(r).some(v => v !== null && v !== ''));
      detectColumns();
      renderDataInfo(file.name);
      renderStatCols();
      renderChartColSel();
      if (numColumns.length > 0) selectStatCol(numColumns[0]);
      showToast('文件加载成功: ' + data.length + ' 行');
    }
  });
}

function detectColumns() {
  numColumns = [];
  if (!data || data.length === 0) return;
  const cols = Object.keys(data[0]);
  cols.forEach(col => {
    const nums = data.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v));
    if (nums.length > data.length * 0.5) numColumns.push(col);
  });
}

function renderDataInfo(filename) {
  document.getElementById('dataInfo').style.display = '';
  document.getElementById('dataFileName').textContent = '📄 ' + filename;
  document.getElementById('dataRows').textContent = data.length + ' 行';
  document.getElementById('dataCols').textContent = Object.keys(data[0]).length + ' 列';
  const cols = Object.keys(data[0]);
  let html = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  data.slice(0, 50).forEach(row => {
    html += '<tr>' + cols.map(c => `<td>${row[c] ?? ''}</td>`).join('') + '</tr>';
  });
  document.getElementById('dataTable').innerHTML = html;
}

function renderStatCols() {
  document.getElementById('statColList').innerHTML = numColumns.map(c =>
    `<div class="col-item ${c===selectedNumCol?'selected':''}" onclick="selectStatCol('${c}')">${c}<span class="type">数值</span></div>`
  ).join('');
}

function renderChartColSel() {
  document.getElementById('chartColSel').innerHTML = numColumns.map(c => `<option>${c}</option>`).join('');
}

function selectStatCol(col) {
  selectedNumCol = col;
  renderStatCols();
  computeStats();
}

function computeStats() {
  if (!selectedNumCol || !data) return;
  const vals = data.map(r => r[selectedNumCol]).filter(v => typeof v === 'number' && !isNaN(v)).sort((a,b) => a-b);
  const n = vals.length;
  const mean = vals.reduce((a,b) => a+b, 0) / n;
  const std = Math.sqrt(vals.reduce((a,b) => a + (b-mean)**2, 0) / (n-1));
  const median = vals[Math.floor(n/2)];
  const q1 = vals[Math.floor(n*0.25)];
  const q3 = vals[Math.floor(n*0.75)];
  const min = vals[0], max = vals[n-1];
  const skew = n > 2 ? (vals.reduce((a,b) => a + ((b-mean)/std)**3, 0) * n) / ((n-1)*(n-2)) : 0;
  const kurt = n > 3 ? (vals.reduce((a,b) => a + ((b-mean)/std)**4, 0) * n*(n+1)) / ((n-1)*(n-2)*(n-3)) - 3*(n-1)**2/((n-2)*(n-3)) : 0;

  document.getElementById('statColName').textContent = '统计结果 - ' + selectedNumCol;
  const stats = [
    ['样本量 n', n], ['均值', mean.toFixed(2)], ['标准差', std.toFixed(2)],
    ['中位数', median.toFixed(2)], ['最小值', min.toFixed(2)], ['最大值', max.toFixed(2)],
    ['极差', (max-min).toFixed(2)], ['Q1 (25%)', q1.toFixed(2)],
    ['Q3 (75%)', q3.toFixed(2)], ['四分位差', (q3-q1).toFixed(2)],
    ['偏度', skew.toFixed(3)], ['峰度', kurt.toFixed(3)],
  ];
  document.getElementById('statGrid').innerHTML = stats.map(([l,v]) =>
    `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`
  ).join('');
}

function renderChart() {
  if (!selectedNumCol) return showToast('请先上传数据');
  const col = document.getElementById('chartColSel').value || selectedNumCol;
  const type = document.getElementById('chartTypeSel').value;
  const el = document.getElementById('chart');
  if (!chartInstance) chartInstance = echarts.init(el);

  const vals = data.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v));
  let option = { title: { text: `${col} - ${document.getElementById('chartTypeSel').selectedOptions[0].text}`, left: 'center' }, tooltip: {}, grid: { left: 60, right: 30, bottom: 50, top: 50 } };

  if (type === 'histogram') {
    const bins = 20;
    const min = Math.min(...vals), max = Math.max(...vals);
    const step = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    vals.forEach(v => { const i = Math.min(Math.floor((v-min)/step), bins-1); counts[i]++; });
    option.xAxis = { type: 'category', data: counts.map((_,i) => (min+i*step).toFixed(1)), name: col };
    option.yAxis = { type: 'value', name: '频数' };
    option.series = [{ type: 'bar', data: counts, itemStyle: { color: '#3b82f6' } }];
  } else if (type === 'boxplot') {
    const sorted = [...vals].sort((a,b) => a-b);
    const n = sorted.length;
    option.xAxis = { type: 'category', data: [col] };
    option.yAxis = { type: 'value', name: col };
    option.series = [{ type: 'boxplot', data: [[sorted[0], sorted[Math.floor(n*0.25)], sorted[Math.floor(n*0.5)], sorted[Math.floor(n*0.75)], sorted[n-1]]] }];
  } else if (type === 'scatter') {
    option.xAxis = { type: 'value', name: '索引' };
    option.yAxis = { type: 'value', name: col };
    option.series = [{ type: 'scatter', data: vals.map((v,i) => [i, v]), itemStyle: { color: '#3b82f6' } }];
  } else if (type === 'line') {
    option.xAxis = { type: 'category', data: vals.map((_,i) => i) };
    option.yAxis = { type: 'value', name: col };
    option.series = [{ type: 'line', data: vals, smooth: true, itemStyle: { color: '#3b82f6' } }];
  } else if (type === 'bar') {
    const bins = 10;
    const min = Math.min(...vals), max = Math.max(...vals);
    const step = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    vals.forEach(v => { const i = Math.min(Math.floor((v-min)/step), bins-1); counts[i]++; });
    option.xAxis = { type: 'value', name: col };
    option.yAxis = { type: 'category', data: counts.map((_,i) => (min+i*step).toFixed(1)) };
    option.series = [{ type: 'bar', data: counts, itemStyle: { color: '#10b981' } }];
  } else if (type === 'pie') {
    const bins = 5;
    const min = Math.min(...vals), max = Math.max(...vals);
    const step = (max - min) / bins;
    const counts = {};
    vals.forEach(v => { const k = ((min + Math.floor((v-min)/step)*step)).toFixed(1); counts[k] = (counts[k]||0)+1; });
    option.series = [{ type: 'pie', radius: '60%', data: Object.entries(counts).map(([k,v]) => ({name:k, value:v})) }];
  } else if (type === 'kde') {
    const bins = 20;
    const min = Math.min(...vals), max = Math.max(...vals);
    const step = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    vals.forEach(v => { const i = Math.min(Math.floor((v-min)/step), bins-1); counts[i]++; });
    option.xAxis = { type: 'category', data: counts.map((_,i) => (min+i*step).toFixed(1)), name: col };
    option.yAxis = { type: 'value', name: '密度' };
    option.series = [
      { type: 'bar', data: counts, itemStyle: { color: '#93c5fd', opacity: 0.6 } },
      { type: 'line', data: counts, smooth: true, lineStyle: { width: 3 }, itemStyle: { color: '#3b82f6' } }
    ];
  } else if (type === 'heatmap') {
    const numCols = numColumns.slice(0, 6);
    const corr = numCols.map(c1 => numCols.map(c2 => {
      const v1 = data.map(r => r[c1]).filter(v => typeof v === 'number');
      const v2 = data.map(r => r[c2]).filter(v => typeof v === 'number');
      const n = Math.min(v1.length, v2.length);
      const m1 = v1.reduce((a,b)=>a+b,0)/n, m2 = v2.reduce((a,b)=>a+b,0)/n;
      const cov = v1.slice(0,n).reduce((a,v,i) => a + (v-m1)*(v2[i]-m2), 0);
      const s1 = Math.sqrt(v1.slice(0,n).reduce((a,v) => a+(v-m1)**2, 0));
      const s2 = Math.sqrt(v2.slice(0,n).reduce((a,v) => a+(v-m2)**2, 0));
      return +(cov/(s1*s2)).toFixed(2);
    }));
    option.xAxis = { type: 'category', data: numCols };
    option.yAxis = { type: 'category', data: numCols };
    option.visualMap = { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 };
    option.series = [{ type: 'heatmap', data: corr.flatMap((row,i) => row.map((v,j) => [j,i,v])), label: { show: true } }];
  }
  chartInstance.setOption(option, true);
}

function generateCode() {
  const type = document.getElementById('codeChartType').value;
  const col = selectedNumCol || 'column_name';
  const codes = {
    histogram: `import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\nx = df['${col}']\n\nfig, ax = plt.subplots(figsize=(8, 5))\nsns.histplot(x, bins=20, kde=True, color='#3b82f6', ax=ax)\nax.set_title('${col} 直方图')\nax.set_xlabel('${col}')\nax.set_ylabel('频数')\nplt.tight_layout()\nplt.savefig('hist.png', dpi=150)\nplt.show()`,
    boxplot: `import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\n\nfig, ax = plt.subplots(figsize=(6, 5))\nsns.boxplot(y=df['${col}'], color='#3b82f6', ax=ax)\nax.set_title('${col} 箱线图')\nax.set_ylabel('${col}')\nplt.tight_layout()\nplt.savefig('box.png', dpi=150)\nplt.show()`,
    scatter: `import pandas as pd\nimport matplotlib.pyplot as plt\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\n\nfig, ax = plt.subplots(figsize=(8, 5))\nax.scatter(range(len(df)), df['${col}'], s=30, alpha=0.6)\nax.set_title('${col} 散点图')\nax.set_xlabel('索引')\nax.set_ylabel('${col}')\nplt.tight_layout()\nplt.savefig('scatter.png', dpi=150)\nplt.show()`,
    line: `import pandas as pd\nimport matplotlib.pyplot as plt\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\n\nfig, ax = plt.subplots(figsize=(10, 5))\nax.plot(df['${col}'], linewidth=1.5)\nax.set_title('${col} 折线图')\nax.set_ylabel('${col}')\nplt.tight_layout()\nplt.savefig('line.png', dpi=150)\nplt.show()`,
    bar: `import pandas as pd\nimport matplotlib.pyplot as plt\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\n\nfig, ax = plt.subplots(figsize=(8, 5))\ndf['${col}'].value_counts().plot(kind='barh', color='#10b981', ax=ax)\nax.set_title('${col} 条形图')\nplt.tight_layout()\nplt.savefig('bar.png', dpi=150)\nplt.show()`,
    pie: `import pandas as pd\nimport matplotlib.pyplot as plt\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\n\nfig, ax = plt.subplots(figsize=(6, 6))\ndf['${col}'].value_counts().plot.pie(autopct='%.1f%%', ax=ax)\nax.set_title('${col} 饼图')\nplt.tight_layout()\nplt.savefig('pie.png', dpi=150)\nplt.show()`,
    kde: `import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\n\nfig, ax = plt.subplots(figsize=(8, 5))\nsns.kdeplot(df['${col}'], fill=True, color='#3b82f6', ax=ax)\nax.set_title('${col} KDE密度图')\nax.set_xlabel('${col}')\nax.set_ylabel('密度')\nplt.tight_layout()\nplt.savefig('kde.png', dpi=150)\nplt.show()`,
    heatmap: `import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nplt.rcParams['font.sans-serif'] = ['SimHei']\nplt.rcParams['axes.unicode_minus'] = False\n\ndf = pd.read_csv('your_data.csv')\nnum_cols = df.select_dtypes(include='number').columns\n\nfig, ax = plt.subplots(figsize=(8, 6))\nsns.heatmap(df[num_cols].corr(), annot=True, cmap='RdBu_r', center=0, square=True, ax=ax)\nax.set_title('相关系数热力图')\nplt.tight_layout()\nplt.savefig('heatmap.png', dpi=150)\nplt.show()`,
  };
  document.getElementById('codeBlock').textContent = codes[type];
}

function exportChart() {
  if (!chartInstance) return showToast('请先生成图表');
  const url = chartInstance.getDataURL({ type: 'png', pixelRatio: 2 });
  const a = document.createElement('a');
  a.href = url; a.download = 'chart.png'; a.click();
  showToast('图片已导出');
}

function copyCode() {
  const code = document.getElementById('codeBlock').textContent;
  navigator.clipboard.writeText(code).then(() => showToast('代码已复制到剪贴板'));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

window.onresize = () => { if (chartInstance) chartInstance.resize(); };
