let currentData = [];
let currentHeaders = [];
let originalDatasetName = "dataset.csv";
let chartInstance = null;

const DOM = {
  uploadPanel: document.getElementById('upload-panel'),
  dashboard: document.getElementById('dashboard'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('file-input'),
  loader: document.getElementById('loader'),
  loaderText: document.getElementById('loader-text'),
  
  tableHead: document.getElementById('table-head'),
  tableBody: document.getElementById('table-body'),
  
  // Dashboard stats
  dispFilename: document.getElementById('display-filename'),
  dispRows: document.getElementById('display-rows'),
  statRows: document.getElementById('stat-rows'),
  statCols: document.getElementById('stat-cols'),
  statMissing: document.getElementById('stat-missing'),
  statDupes: document.getElementById('stat-dupes'),
  colStatsBody: document.getElementById('column-stats-body'),

  // Controls
  btnDropNulls: document.getElementById('btn-drop-nulls'),
  btnDropDupes: document.getElementById('btn-drop-dupes'),
  btnFillNulls: document.getElementById('btn-fill-nulls'),
  btnExport: document.getElementById('btn-export'),
  btnReset: document.getElementById('btn-reset'),

  // Google Sheets
  gSheetUrl: document.getElementById('g-sheet-url'),
  btnImportSheet: document.getElementById('btn-import-sheet'),

  // Charts
  chartType: document.getElementById('chart-type'),
  chartX: document.getElementById('chart-x'),
  chartY: document.getElementById('chart-y'),
  btnDrawChart: document.getElementById('btn-draw-chart'),
  chartCanvas: document.getElementById('main-chart')
};

// --- FILE UPLOAD LOGIC ---

DOM.dropzone.addEventListener('click', (e) => {
  if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
    DOM.fileInput.click();
  }
});

DOM.dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  DOM.dropzone.classList.add('dragover');
});

DOM.dropzone.addEventListener('dragleave', () => {
  DOM.dropzone.classList.remove('dragover');
});

DOM.dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  DOM.dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

DOM.fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFile(e.target.files[0]);
  }
});

DOM.btnImportSheet.addEventListener('click', () => {
  const url = DOM.gSheetUrl.value.trim();
  if(!url) return alert('Please enter a valid Google Sheet URL.');
  
  // Extract sheet ID
  const match = url.match(/\/d\/(.*?)\//);
  if(match && match[1]) {
    const sheetId = match[1];
    // Create CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    showLoader("Fetching Google Sheet...");
    fetch(csvUrl)
      .then(res => {
        if(!res.ok) throw new Error("Could not fetch sheet. Ensure it is public.");
        return res.blob();
      })
      .then(blob => {
        const file = new File([blob], "Google_Sheet_Export.csv", {type: "text/csv"});
        handleFile(file);
      })
      .catch(err => {
        hideLoader();
        alert(err.message);
      });
  } else {
    alert("Invalid Google Sheet URL format.");
  }
});

function handleFile(file) {
  originalDatasetName = file.name;
  showLoader("Parsing file...");
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    // Use SheetJS to read
    const workbook = XLSX.read(data, {type: 'array'});
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    
    // Convert to array of objects
    // defval: "" ensures empty cells are included as empty strings
    const json = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
    
    if(json.length === 0) {
      hideLoader();
      alert("No data found in file.");
      return;
    }
    
    currentHeaders = Object.keys(json[0]);
    currentData = json;
    
    initDashboard();
  };
  reader.readAsArrayBuffer(file);
}

// --- DASHBOARD LOGIC ---

function initDashboard() {
  hideLoader();
  DOM.uploadPanel.style.display = 'none';
  DOM.dashboard.classList.add('active');
  updateUI();
  populateChartOptions();
}

function updateUI() {
  renderTable();
  calculateStats();
  
  DOM.dispFilename.innerHTML = `<i class="fa-solid fa-table"></i> ${originalDatasetName}`;
  DOM.dispRows.innerText = `${currentData.length.toLocaleString()} rows • ${currentHeaders.length} columns`;
}

function renderTable() {
  // Truncate to save DOM performance if huge dataset
  const MAX_ROWS = 100;
  const displayData = currentData.slice(0, MAX_ROWS);
  
  DOM.tableHead.innerHTML = currentHeaders.map(h => `<th>${h}</th>`).join('');
  
  DOM.tableBody.innerHTML = displayData.map(row => {
    return `<tr>${currentHeaders.map(h => {
      let val = row[h];
      if(val === "" || val === null || val === undefined) val = `<span style="color:var(--danger)"><i>null</i></span>`;
      return `<td>${val}</td>`;
    }).join('')}</tr>`;
  }).join('');
}

function calculateStats() {
  const rowCount = currentData.length;
  const colCount = currentHeaders.length;
  let totalMissing = 0;
  
  // Calculate dupes (basic JSON stringify comparison - can be heavy for large arrays)
  let dupeCount = 0;
  if(rowCount < 20000) { // Limit for performance
    const uniqueSet = new Set(currentData.map(r => JSON.stringify(r)));
    dupeCount = rowCount - uniqueSet.size;
  } else {
    dupeCount = "Too large to calc";
  }

  // Column stats
  const colStats = currentHeaders.map(h => {
    let emptyCount = 0;
    const values = new Set();
    let numCount = 0;
    
    for(let i=0; i<rowCount; i++) {
      let v = currentData[i][h];
      if(v === "" || v === null || v === undefined) {
        emptyCount++;
        totalMissing++;
      } else {
        values.add(v);
        if(!isNaN(Number(v))) numCount++;
      }
    }
    
    const type = numCount > (rowCount - emptyCount) * 0.8 ? 'Number' : 'String';
    
    return `<tr>
      <td><strong>${h}</strong></td>
      <td><span style="font-size:0.8rem; padding:0.2rem 0.5rem; background:rgba(139,92,246,0.3); border-radius:4px">${type}</span></td>
      <td style="${emptyCount > 0 ? 'color:var(--danger)' : ''}">${emptyCount} (${((emptyCount/rowCount)*100).toFixed(1)}%)</td>
      <td>${values.size}</td>
    </tr>`;
  });

  DOM.statRows.innerText = rowCount.toLocaleString();
  DOM.statCols.innerText = colCount;
  DOM.statMissing.innerText = totalMissing.toLocaleString();
  DOM.statDupes.innerText = dupeCount;
  DOM.colStatsBody.innerHTML = colStats.join('');
}

// --- CLEANING ACTIONS ---

DOM.btnDropNulls.addEventListener('click', () => {
  showLoader("Removing rows with empty values...");
  setTimeout(() => {
    currentData = currentData.filter(row => {
      return !currentHeaders.some(h => row[h] === "" || row[h] === null || row[h] === undefined);
    });
    updateUI();
    hideLoader();
  }, 100);
});

DOM.btnDropDupes.addEventListener('click', () => {
  showLoader("Removing duplicates...");
  setTimeout(() => {
    const seen = new Set();
    currentData = currentData.filter(row => {
      const str = JSON.stringify(row);
      if(seen.has(str)) return false;
      seen.add(str);
      return true;
    });
    updateUI();
    hideLoader();
  }, 100);
});

DOM.btnFillNulls.addEventListener('click', () => {
  showLoader("Filling missing values...");
  setTimeout(() => {
    // Basic heuristic: check if column is mostly numbers to fill 0, else fill 'Unknown'
    const colTypes = {};
    currentHeaders.forEach(h => {
      let n = 0; let total = 0;
      currentData.forEach(row => {
        if(row[h] !== "") { total++; if(!isNaN(row[h])) n++; }
      });
      colTypes[h] = (n > 0 && n === total) ? 0 : "Unknown";
    });

    currentData = currentData.map(row => {
      const newRow = {...row};
      currentHeaders.forEach(h => {
        if(newRow[h] === "" || newRow[h] === null || newRow[h] === undefined) {
          newRow[h] = colTypes[h];
        }
      });
      return newRow;
    });
    updateUI();
    hideLoader();
  }, 100);
});

// --- EXPORT & RESET ---

DOM.btnExport.addEventListener('click', () => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(currentData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, worksheet, "CleanedData");
    XLSX.writeFile(newWorkbook, "Cleaned_" + originalDatasetName);
  } catch(e) {
    // Fallback to CSV if huge
    const csvContent = "data:text/csv;charset=utf-8," 
      + currentHeaders.join(",") + "\n"
      + currentData.map(e => currentHeaders.map(h => e[h]).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Cleaned_" + originalDatasetName.replace('.xlsx','.csv'));
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
});

DOM.btnReset.addEventListener('click', () => {
  if(confirm("Are you sure you want to start over? All unsaved cleaning progress will be lost.")) {
    location.reload();
  }
});

// --- TABS LOGIC ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// --- CHARTS LOGIC ---
function populateChartOptions() {
  const options = currentHeaders.map(h => `<option value="${h}">${h}</option>`);
  DOM.chartX.innerHTML = options.join('');
  DOM.chartY.innerHTML = options.join('');
}

DOM.btnDrawChart.addEventListener('click', () => {
  const type = DOM.chartType.value;
  const xCol = DOM.chartX.value;
  const yCol = DOM.chartY.value;
  
  if(!xCol || !yCol) return alert("Select X and Y columns.");
  
  // Aggregate data if categorical X
  let labels = [];
  let dataPoints = [];
  
  if(type === 'bar' || type === 'pie') {
    // Group By X, Sum/Count Y
    const map = {};
    currentData.forEach(row => {
      const key = row[xCol];
      const val = Number(row[yCol]) || 1; // if y isn't a number, act as purely count
      if(key !== "" && key !== undefined) {
          map[key] = (map[key] || 0) + val;
      }
    });

    const entries = Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 30); // Max 30 bars
    labels = entries.map(e => e[0]);
    dataPoints = entries.map(e => e[1]);
  } else {
    // Scatter / Line
    const sorted = [...currentData].slice(0, 500); // Sample for performance
    labels = sorted.map(r => r[xCol]);
    dataPoints = sorted.map(r => Number(r[yCol]) || 0);
  }

  if(chartInstance) {
    chartInstance.destroy();
  }

  const ctx = DOM.chartCanvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: `${yCol} by ${xCol}`,
        data: dataPoints,
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)', // Corporate blue
          'rgba(16, 185, 129, 0.7)', // Emerald
          'rgba(245, 158, 11, 0.7)', // Amber
          'rgba(139, 92, 246, 0.7)', // Violet
          'rgba(239, 68, 68, 0.7)'   // Red
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      color: '#f8fafc',
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: (type === 'pie' || type === 'doughnut') ? {} : {
        x: { ticks: { color: '#94a3b8' }, title: { display: true, text: xCol, color: '#f8fafc', font: {weight: 'bold'} } },
        y: { ticks: { color: '#94a3b8' }, title: { display: true, text: yCol, color: '#f8fafc', font: {weight: 'bold'} } }
      },
      plugins: {
        legend: { labels: { color: '#f8fafc', font: {family: 'Inter'} } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { size: 14, family: 'Inter', weight: 'bold' },
          bodyFont: { size: 13, family: 'Inter' },
          padding: 12,
          borderColor: 'rgba(148, 163, 184, 0.2)',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              return 'Name (' + xCol + '): ' + context[0].label;
            },
            label: function(context) {
              return 'Value (' + yCol + '): ' + context.formattedValue;
            }
          }
        }
      }
    }
  });
});

// --- UTILS ---
function showLoader(msg) {
  DOM.loaderText.innerText = msg;
  DOM.loader.style.display = 'flex';
}
function hideLoader() {
  DOM.loader.style.display = 'none';
}
