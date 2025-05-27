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

// Remover variáveis relacionadas aos gráficos que não são mais usadas
let currentFunction = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateMethodDisplay();
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

    // No longer needed - using MathLive calculator
}



// Function to get current function value from the math calculator
function getCurrentFunction() {
    const hiddenInput = document.getElementById('function');
    return hiddenInput ? hiddenInput.value : '';
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
    const functionInput = document.getElementById('function');
    const value = functionInput ? functionInput.value.trim() : '';
    
    if (!value) {
        showInputError(functionInput, 'Por favor, insira uma função');
        return false;
    }
    
    clearInputError(functionInput);
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
    
    // Get function value from hidden input (updated by math calculator)
    const functionInput = document.getElementById('function');
    const functionValue = functionInput ? functionInput.value : '';
    
    if (!functionValue || functionValue.trim() === '') {
        showError('Por favor, insira uma função matemática válida');
        return;
    }
    
    // Validate all inputs
    const isValid = validateForm();
    if (!isValid) {
        return;
    }
    
    // Prepare data
    const formData = new FormData(form);
    const data = {
        function: functionValue, // Use the function from math editor
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
        
        // Verificar se f(a) e f(b) têm sinais opostos (importante para garantir a convergência)
        try {
            const fa = evaluateFunction(data.function, data.a);
            const fb = evaluateFunction(data.function, data.b);
            
            if (fa * fb >= 0) {
                showError('Os valores de f(a) e f(b) devem ter sinais opostos para o método da Falsa Posição');
                return;
            }
        } catch (err) {
            console.error('Erro ao avaliar função:', err);
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
    document.getElementById('rootValue').textContent = formatNumber(result.root);
    document.getElementById('functionValue').textContent = formatNumber(result.function_value);
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
    
    // Não precisamos mais chamar createCharts aqui
    
    // Show results with animation
    results.classList.remove('hidden');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update current function for future use
    currentFunction = getCurrentFunction();
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
        headers = ['i', 'xi', 'xi+1', 'f(xi)', "f'(xi)", 'Erro Absoluto', 'Erro Relativo'];
    } else {
        // False Position headers
        headers = ['Iteração', 'a', 'b', 'x', 'f(a)', 'f(b)', 'f(x)', 'Erro Absoluto', 'Erro Relativo'];
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
            xiCell.textContent = formatNumber(iteration.xi);
            row.appendChild(xiCell);
            
            // xi+1 value
            const xiPlusOneCell = document.createElement('td');
            xiPlusOneCell.textContent = formatNumber(iteration.xi_plus_1);
            row.appendChild(xiPlusOneCell);
            
            // f(xi) value
            const fxiCell = document.createElement('td');
            fxiCell.textContent = formatNumber(iteration.fxi);
            row.appendChild(fxiCell);
            
            // f'(xi) value
            const dfxiCell = document.createElement('td');
            dfxiCell.textContent = formatNumber(iteration.dfxi);
            row.appendChild(dfxiCell);
            
            // Absolute error
            const absErrorCell = document.createElement('td');
            absErrorCell.textContent = formatNumber(iteration.absolute_error);
            row.appendChild(absErrorCell);
            
            // Relative error (without %)
            const relErrorCell = document.createElement('td');
            relErrorCell.textContent = formatNumber(iteration.relative_error_percent);
            row.appendChild(relErrorCell);
            
        } else {
            // False Position table format com verificação de dados
            
            // Iteration number
            const iterationCell = document.createElement('td');
            iterationCell.textContent = iteration.iteration;
            row.appendChild(iterationCell);
            
            // a value
            const aCell = document.createElement('td');
            aCell.textContent = formatNumber(iteration.a);
            row.appendChild(aCell);
            
            // b value
            const bCell = document.createElement('td');
            bCell.textContent = formatNumber(iteration.b);
            row.appendChild(bCell);
            
            // x value (xr - ponto onde a reta corta o eixo x)
            const xCell = document.createElement('td');
            xCell.textContent = formatNumber(iteration.x);
            if (index > 0) {
                // Verificar se x está consistente com a fórmula
                const prevIteration = result.iterations[index-1];
                const x_expected = calculateFalsePositionX(prevIteration.a, prevIteration.b, prevIteration.fa, prevIteration.fb);
                if (Math.abs(x_expected - iteration.x) > 0.0001) {
                    xCell.title = `Valor esperado pela fórmula: ${formatNumber(x_expected)}`;
                    xCell.style.color = 'red';
                }
            }
            row.appendChild(xCell);
            
            // f(a) value
            const faCell = document.createElement('td');
            faCell.textContent = formatNumber(iteration.fa);
            row.appendChild(faCell);
            
            // f(b) value
            const fbCell = document.createElement('td');
            fbCell.textContent = formatNumber(iteration.fb);
            row.appendChild(fbCell);
            
            // f(x) value
            const fxCell = document.createElement('td');
            fxCell.textContent = formatNumber(iteration.fx);
            row.appendChild(fxCell);
            
            // Absolute error
            const absErrorCell = document.createElement('td');
            absErrorCell.textContent = formatNumber(iteration.absolute_error);
            row.appendChild(absErrorCell);
            
            // Relative error
            const relErrorCell = document.createElement('td');
            relErrorCell.textContent = formatNumber(iteration.relative_error);
            row.appendChild(relErrorCell);
        }
        
        tableBody.appendChild(row);
    });
}

// Adicionar uma função para verificar o cálculo do x no método da falsa posição
function calculateFalsePositionX(a, b, fa, fb) {
    // Implementando a fórmula da Falsa Posição de forma mais clara:
    // xr = (a*f(b) - b*f(a))/(f(b) - f(a))
    return (a*fb - b*fa) / (fb - fa);
}

// Implementar a função evaluateFunction completa para avaliação de funções
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
    
    // Adicionando validações extras
    if (expression.includes('undefined') || expression.includes('NaN')) {
        return NaN;
    }
    
    // Evaluate safely
    try {
        return Function('"use strict"; return (' + expression + ')')();
    } catch (e) {
        return NaN;
    }
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
    // Não precisamos mais limpar gráficos que não existem
}

// Função para formatar números que pode ser usada globalmente
function formatNumber(num) {
    if (num === undefined || num === null || num === 'N/A') return 'N/A';
    
    // Convert to number if it's a string
    let value = typeof num === 'string' ? parseFloat(num) : num;
    
    if (isNaN(value)) return 'N/A';
    
    // Format based on the magnitude of the number
    let formattedValue;
    if (Math.abs(value) < 0.001 && value !== 0) {
        // Scientific notation for very small numbers
        const expFormat = value.toExponential(1);
        // Replace dot with comma and "e-" with "E-"
        formattedValue = expFormat.replace('.', ',').replace('e-', 'E-');
    } else {
        // Regular format with 5 decimal places
        formattedValue = value.toFixed(5).replace('.', ',');
        // Remove trailing zeros
        formattedValue = formattedValue.replace(/,?0+$/, '');
    }
    
    return formattedValue;
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
