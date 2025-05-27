// DOM Elements
const form = document.getElementById('calculatorForm');
const methodRadios = document.querySelectorAll('input[name="method"]');
const falsePositionParams = document.getElementById('false-position-params');
const newtonParams = document.getElementById('newton-params');
const falsePositionInfo = document.getElementById('false-position-info');
const newtonInfo = document.getElementById('newton-info');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');
const limitFields = document.querySelectorAll('.limit-field');

// Function expression storage
let currentFunction = '';
let functionChart = null;
let convergenceChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateMethodDisplay();
    initializeCalculator();
});

function setupEventListeners() {
    // Method selection change
    methodRadios.forEach(radio => {
        radio.addEventListener('change', updateMethodDisplay);
    });

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Input validation
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', validateInput);
    });

    // Calculator buttons
    setupCalculatorButtons();

    // Function display click to focus
    functionDisplay.addEventListener('click', function() {
        functionContent.focus();
    });
}

function initializeCalculator() {
    currentFunction = '';
    updateFunctionDisplay();
}

function setupCalculatorButtons() {
    // Number buttons
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            insertToFunction(this.getAttribute('data-number'));
        });
    });

    // Operator buttons  
    document.querySelectorAll('.operator-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const op = this.getAttribute('data-op');
            insertToFunction(op === '×' ? '*' : op);
        });
    });

    // Function buttons
    document.querySelectorAll('.function-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            insertToFunction(this.getAttribute('data-func'));
        });
    });

    // Power buttons
    document.querySelectorAll('.power-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const power = this.getAttribute('data-power');
            insertToFunction('^' + power);
        });
    });

    // Constant buttons
    document.querySelectorAll('.constant-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            insertToFunction(this.getAttribute('data-const'));
        });
    });

    // Variable button
    document.querySelectorAll('.variable-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            insertToFunction(this.getAttribute('data-var'));
        });
    });

    // Special buttons
    document.querySelectorAll('.special-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            insertToFunction(this.getAttribute('data-symbol'));
        });
    });

    // Action buttons
    const clearBtn = document.getElementById('clearBtn');
    const backspaceBtn = document.getElementById('backspaceBtn');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFunction);
    }
    if (backspaceBtn) {
        backspaceBtn.addEventListener('click', backspaceFunction);
    }

    // Generic symbol buttons
    document.querySelectorAll('[data-symbol]').forEach(btn => {
        if (!btn.classList.contains('special-btn')) {
            btn.addEventListener('click', function() {
                insertToFunction(this.getAttribute('data-symbol'));
            });
        }
    });
}

function insertToFunction(value) {
    currentFunction += value;
    updateFunctionDisplay();
    clearInputError(hiddenInput);
}

function clearFunction() {
    currentFunction = '';
    updateFunctionDisplay();
}

function backspaceFunction() {
    currentFunction = currentFunction.slice(0, -1);
    updateFunctionDisplay();
}

function updateFunctionDisplay() {
    if (currentFunction === '') {
        functionContent.innerHTML = '<span class="placeholder">Digite sua função...</span>';
        hiddenInput.value = '';
    } else {
        // Convert function to display format with superscripts
        const displayFunction = formatFunctionForDisplay(currentFunction);
        functionContent.innerHTML = displayFunction;
        hiddenInput.value = currentFunction;
    }
}

function formatFunctionForDisplay(func) {
    // Convert ^ notation to superscript for display
    let formatted = func;
    
    // Handle powers with parentheses like ^(2+x)
    formatted = formatted.replace(/\^(\([^)]+\))/g, '<span class="superscript">$1</span>');
    
    // Handle simple powers like ^2, ^3, ^x, etc.
    formatted = formatted.replace(/\^([a-zA-Z0-9]+)/g, '<span class="superscript">$1</span>');
    
    // Replace common functions with better display
    formatted = formatted.replace(/sqrt\(/g, '√(');
    formatted = formatted.replace(/log\(/g, 'ln(');
    formatted = formatted.replace(/\bpi\b/g, 'π');
    formatted = formatted.replace(/\be\b(?![a-zA-Z])/g, 'e');
    
    return formatted;
}

function updateMethodDisplay() {
    const selectedMethod = document.querySelector('input[name="method"]:checked').value;
    
    // Update parameter visibility
    if (selectedMethod === 'falsa_posicao') {
        falsePositionParams.classList.add('active');
        newtonParams.classList.remove('active');
        falsePositionInfo.classList.add('active');
        newtonInfo.classList.remove('active');
    } else {
        falsePositionParams.classList.remove('active');
        newtonParams.classList.add('active');
        falsePositionInfo.classList.remove('active');
        newtonInfo.classList.add('active');
    }

    // Clear previous results and errors
    hideResults();
    hideError();
}



function validateInput(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    
    if (input.id === 'tolerance' && value <= 0) {
        showInputError(input, 'A tolerância deve ser maior que zero');
        return false;
    }
    
    if (input.id === 'max_iterations' && (value <= 0 || !Number.isInteger(value))) {
        showInputError(input, 'Deve ser um número inteiro positivo');
        return false;
    }
    
    clearInputError(input);
    return true;
}

function validateFunction() {
    const value = currentFunction.trim();
    
    if (!value) {
        showInputError(hiddenInput, 'Por favor, insira uma função');
        return false;
    }
    
    clearInputError(hiddenInput);
    return true;
}

function showInputError(input, message) {
    clearInputError(input);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    errorElement.style.color = '#f44336';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    input.style.borderColor = '#f44336';
    input.parentNode.appendChild(errorElement);
}

function clearInputError(input) {
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
    input.style.borderColor = '';
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate all inputs
    const isValid = validateForm();
    if (!isValid) {
        return;
    }
    
    // Prepare data
    const formData = new FormData(form);
    const data = {
        function: formData.get('function'),
        method: formData.get('method'),
        tolerance: parseFloat(formData.get('tolerance')),
        max_iterations: parseInt(formData.get('max_iterations'))
    };
    
    // Add method-specific parameters
    if (data.method === 'falsa_posicao') {
        data.a = parseFloat(formData.get('a'));
        data.b = parseFloat(formData.get('b'));
        
        if (data.a >= data.b) {
            showError('O limite inferior (a) deve ser menor que o limite superior (b)');
            return;
        }
    } else {
        data.x0 = parseFloat(formData.get('x0'));
    }
    
    // Show loading
    showLoading();
    
    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro no servidor');
        }
        
        displayResults(result);
        
    } catch (err) {
        console.error('Calculation error:', err);
        showError(err.message || 'Erro ao calcular. Tente novamente.');
    } finally {
        hideLoading();
    }
}

function validateForm() {
    const toleranceInput = document.getElementById('tolerance');
    const maxIterationsInput = document.getElementById('max_iterations');
    const selectedMethod = document.querySelector('input[name="method"]:checked').value;
    
    let isValid = true;
    
    // Validate function
    if (!validateFunction()) {
        isValid = false;
    }
    
    // Validate tolerance
    if (!validateInput({ target: toleranceInput })) {
        isValid = false;
    }
    
    // Validate max iterations
    if (!validateInput({ target: maxIterationsInput })) {
        isValid = false;
    }
    
    // Validate method-specific parameters
    if (selectedMethod === 'falsa_posicao') {
        const aInput = document.getElementById('a');
        const bInput = document.getElementById('b');
        
        if (!aInput.value || !bInput.value) {
            showError('Para o método da Falsa Posição, os limites a e b são obrigatórios');
            isValid = false;
        }
    } else {
        const x0Input = document.getElementById('x0');
        
        if (!x0Input.value) {
            showError('Para o método de Newton-Raphson, o ponto inicial x₀ é obrigatório');
            isValid = false;
        }
    }
    
    return isValid;
}

function showLoading() {
    hideResults();
    hideError();
    loading.classList.remove('hidden');
    
    // Disable form
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';
}

function hideLoading() {
    loading.classList.add('hidden');
    
    // Re-enable form
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-calculator"></i><span>Calcular Raiz</span><i class="fas fa-heart"></i>';
}

function displayResults(result) {
    hideError();
    
    // Update method badge
    const methodBadge = document.getElementById('methodBadge');
    methodBadge.textContent = result.method;
    
    // Update summary cards
    document.getElementById('rootValue').textContent = result.root;
    document.getElementById('functionValue').textContent = result.function_value;
    document.getElementById('timeValue').textContent = `${result.execution_time}s`;
    document.getElementById('iterationsValue').textContent = result.total_iterations;
    
    // Update convergence info
    const convergenceInfo = document.getElementById('convergenceInfo');
    if (result.converged) {
        convergenceInfo.textContent = '✓ Método convergiu com sucesso!';
        convergenceInfo.className = 'convergence-info converged';
    } else {
        convergenceInfo.textContent = '⚠ Método não convergiu no número máximo de iterações';
        convergenceInfo.className = 'convergence-info not-converged';
    }
    
    // Build iterations table
    buildIterationsTable(result);
    
    // Create charts
    createCharts(result);
    
    // Show results with animation
    results.classList.remove('hidden');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildIterationsTable(result) {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing content
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Create header based on method
    const headerRow = document.createElement('tr');
    let headers = [];
    
    if (result.method === 'Newton-Raphson') {
        // Newton-Raphson headers following theory format
        headers = ['i', 'xi', 'xi+1', 'f(xi)', "f'(xi)", 'Erro Absoluto', 'Erro Relativo (%)'];
    } else {
        // False Position headers
        headers = ['Iteração', 'x', 'f(x)', 'Erro Absoluto', 'Erro Relativo'];
    }
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    tableHead.appendChild(headerRow);
    
    // Create body rows
    result.iterations.forEach((iteration, index) => {
        const row = document.createElement('tr');
        
        if (result.method === 'Newton-Raphson') {
            // Newton-Raphson table format following theory
            
            // Iteration number (i)
            const iterationCell = document.createElement('td');
            iterationCell.textContent = iteration.iteration - 1; // Start from 0 like in theory
            row.appendChild(iterationCell);
            
            // xi value
            const xiCell = document.createElement('td');
            xiCell.textContent = iteration.xi;
            row.appendChild(xiCell);
            
            // xi+1 value
            const xiPlusOneCell = document.createElement('td');
            xiPlusOneCell.textContent = iteration.xi_plus_1;
            row.appendChild(xiPlusOneCell);
            
            // f(xi) value
            const fxiCell = document.createElement('td');
            fxiCell.textContent = iteration.fxi;
            row.appendChild(fxiCell);
            
            // f'(xi) value
            const dfxiCell = document.createElement('td');
            dfxiCell.textContent = iteration.dfxi;
            row.appendChild(dfxiCell);
            
            // Absolute error
            const absErrorCell = document.createElement('td');
            absErrorCell.textContent = iteration.absolute_error;
            row.appendChild(absErrorCell);
            
            // Relative error (%)
            const relErrorCell = document.createElement('td');
            relErrorCell.textContent = iteration.relative_error_percent + '%';
            row.appendChild(relErrorCell);
            
        } else {
            // False Position table format (existing)
            
            // Iteration number
            const iterationCell = document.createElement('td');
            iterationCell.textContent = iteration.iteration;
            row.appendChild(iterationCell);
            
            // x value
            const xCell = document.createElement('td');
            xCell.textContent = iteration.x;
            row.appendChild(xCell);
            
            // f(x) value
            const fxCell = document.createElement('td');
            fxCell.textContent = iteration.fx;
            row.appendChild(fxCell);
            
            // Absolute error
            const absErrorCell = document.createElement('td');
            absErrorCell.textContent = iteration.absolute_error;
            row.appendChild(absErrorCell);
            
            // Relative error
            const relErrorCell = document.createElement('td');
            relErrorCell.textContent = iteration.relative_error;
            row.appendChild(relErrorCell);
        }
        
        tableBody.appendChild(row);
    });
}

function showError(message) {
    hideResults();
    hideLoading();
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    error.classList.remove('hidden');
    
    // Scroll to error
    error.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    error.classList.add('hidden');
}

function hideResults() {
    results.classList.add('hidden');
    // Destroy existing charts
    if (functionChart) {
        functionChart.destroy();
        functionChart = null;
    }
    if (convergenceChart) {
        convergenceChart.destroy();
        convergenceChart = null;
    }
}

function createCharts(result) {
    createFunctionChart(result);
    createConvergenceChart(result);
}

function createFunctionChart(result) {
    const ctx = document.getElementById('functionChart');
    if (!ctx) return;

    // Destroy existing chart
    if (functionChart) {
        functionChart.destroy();
    }

    // Generate function data points
    const functionData = generateFunctionData(result);
    
    functionChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'f(x)',
                    data: functionData.points,
                    borderColor: 'rgb(236, 64, 122)',
                    backgroundColor: 'rgba(236, 64, 122, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'y = 0',
                    data: functionData.zeroLine,
                    borderColor: 'rgba(100, 100, 100, 0.5)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Raiz encontrada',
                    data: [{ x: result.root, y: 0 }],
                    backgroundColor: 'rgb(76, 175, 80)',
                    borderColor: 'rgb(76, 175, 80)',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    showLine: false
                },
                ...generateIterationPoints(result)
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Gráfico de ${currentFunction}`,
                    font: { size: 16, weight: 'bold' },
                    color: 'rgb(236, 64, 122)'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'x'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'f(x)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function createConvergenceChart(result) {
    const ctx = document.getElementById('convergenceChart');
    if (!ctx) return;

    // Destroy existing chart
    if (convergenceChart) {
        convergenceChart.destroy();
    }

    const convergenceData = generateConvergenceData(result);
    
    convergenceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Valor de x',
                    data: convergenceData.xValues,
                    borderColor: 'rgb(33, 150, 243)',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Erro Relativo (%)',
                    data: convergenceData.errors,
                    borderColor: 'rgb(255, 152, 0)',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1'
                },
                {
                    label: 'Raiz verdadeira',
                    data: convergenceData.trueLine,
                    borderColor: 'rgba(76, 175, 80, 0.8)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Convergência - ${result.method}`,
                    font: { size: 16, weight: 'bold' },
                    color: 'rgb(236, 64, 122)'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Iteração'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Valor de x'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Erro Relativo (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function generateFunctionData(result) {
    // Calculate range around the root
    const root = result.root;
    const range = Math.max(2, Math.abs(root) * 0.5);
    const xMin = root - range;
    const xMax = root + range;
    const numPoints = 200;
    const step = (xMax - xMin) / numPoints;
    
    const points = [];
    const zeroLine = [];
    
    // Generate function points using simple evaluation
    for (let i = 0; i <= numPoints; i++) {
        const x = xMin + i * step;
        try {
            // Simple function evaluation for common cases
            let y = evaluateFunction(currentFunction, x);
            
            if (isFinite(y) && Math.abs(y) < 1000) {
                points.push({ x: x, y: y });
            }
        } catch (e) {
            // Skip problematic points
        }
        zeroLine.push({ x: x, y: 0 });
    }
    
    return { points, zeroLine };
}

function generateIterationPoints(result) {
    const points = [];
    
    if (result.method === 'Newton-Raphson') {
        // Show Newton-Raphson iteration points
        result.iterations.forEach((iter, index) => {
            points.push({
                label: `Iteração ${index}`,
                data: [{ x: iter.xi, y: iter.fxi }],
                backgroundColor: `hsl(${index * 30}, 70%, 50%)`,
                borderColor: `hsl(${index * 30}, 70%, 40%)`,
                pointRadius: 5,
                showLine: false
            });
        });
    } else {
        // Show False Position interval progression
        result.iterations.forEach((iter, index) => {
            points.push({
                label: `Iteração ${index + 1}`,
                data: [{ x: iter.x, y: iter.fx }],
                backgroundColor: `hsl(${index * 20}, 60%, 50%)`,
                borderColor: `hsl(${index * 20}, 60%, 40%)`,
                pointRadius: 4,
                showLine: false
            });
        });
    }
    
    return points;
}

function generateConvergenceData(result) {
    const xValues = [];
    const errors = [];
    const trueLine = [];
    
    result.iterations.forEach((iter, index) => {
        if (result.method === 'Newton-Raphson') {
            xValues.push({ x: index, y: iter.xi_plus_1 });
            if (iter.relative_error_percent !== 'N/A') {
                errors.push({ x: index, y: parseFloat(iter.relative_error_percent) });
            }
        } else {
            xValues.push({ x: index, y: iter.x });
            if (iter.relative_error !== 'N/A') {
                errors.push({ x: index, y: parseFloat(iter.relative_error) * 100 });
            }
        }
        trueLine.push({ x: index, y: result.root });
    });
    
    return { xValues, errors, trueLine };
}

function evaluateFunction(func, x) {
    // Simple function evaluator for common mathematical expressions
    let expression = func;
    
    // Replace mathematical constants and functions
    expression = expression.replace(/\bpi\b/g, Math.PI);
    expression = expression.replace(/\be\b/g, Math.E);
    expression = expression.replace(/\^/g, '**');
    expression = expression.replace(/sqrt\(/g, 'Math.sqrt(');
    expression = expression.replace(/sin\(/g, 'Math.sin(');
    expression = expression.replace(/cos\(/g, 'Math.cos(');
    expression = expression.replace(/tan\(/g, 'Math.tan(');
    expression = expression.replace(/log\(/g, 'Math.log(');
    expression = expression.replace(/exp\(/g, 'Math.exp(');
    expression = expression.replace(/\bx\b/g, x);
    
    // Evaluate safely
    try {
        return Function('"use strict"; return (' + expression + ')')();
    } catch (e) {
        return NaN;
    }
}

// Add some mathematical function examples on focus
document.getElementById('function').addEventListener('focus', function() {
    if (!this.value) {
        this.placeholder = 'Ex: x**3 - x - 2, sin(x) - 0.5, exp(x) - 2';
    }
});

document.getElementById('function').addEventListener('blur', function() {
    this.placeholder = 'Ex: x**3 - x - 2';
});

// Add smooth scrolling behavior for all internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!loading.classList.contains('hidden')) return;
        form.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear results
    if (event.key === 'Escape') {
        hideResults();
        hideError();
    }
});

// Add copy functionality for results
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const toast = document.createElement('div');
        toast.textContent = 'Copiado para a área de transferência! 💖';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            animation: fadeInUp 0.3s ease-out;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    });
}

// Add double-click to copy functionality to result values
document.addEventListener('DOMContentLoaded', function() {
    const copyableElements = [
        '#rootValue',
        '#functionValue',
        '#timeValue',
        '#iterationsValue'
    ];
    
    copyableElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.cursor = 'pointer';
            element.title = 'Clique duas vezes para copiar';
            element.addEventListener('dblclick', function() {
                copyToClipboard(this.textContent);
            });
        }
    });
});
