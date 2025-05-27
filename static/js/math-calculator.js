// Calculadora Científica com MathLive
class MathCalculator {
    constructor() {
        this.mathField = null;
        this.expressionHistory = [];
        this.isCalculatorCollapsed = false;
        this.init();
    }

    init() {
        this.setupMathField();
        this.setupCalculatorButtons();
        this.setupToggleCalculator();
        this.setupHistoryButtons();
        this.setupValidation();
        this.loadExpressionHistory();
    }

    setupMathField() {
        const mathEditor = document.getElementById('mathEditor');
        if (!mathEditor) return;

        // Configure MathLive
        this.mathField = new MathfieldElement();
        this.mathField.id = 'mathEditor';
        this.mathField.className = 'math-input';
        
        // Set initial value
        this.mathField.value = 'x^2 + 2x + 1';
        
        // Replace the existing element
        mathEditor.parentNode.replaceChild(this.mathField, mathEditor);

        // Configure MathLive options
        this.mathField.setOptions({
            virtualKeyboardMode: 'off',
            smartFence: true,
            smartSuperscript: true,
            locale: 'pt-BR'
        });

        // Listen for input changes
        this.mathField.addEventListener('input', (ev) => {
            this.onMathFieldChange();
        });

        // Update hidden input initially
        this.onMathFieldChange();
    }

    setupCalculatorButtons() {
        const calculatorBody = document.getElementById('calculatorBody');
        if (!calculatorBody) return;

        // Add event listeners to all calculator buttons
        calculatorBody.addEventListener('click', (e) => {
            const button = e.target.closest('.calc-btn');
            if (!button) return;

            const latex = button.getAttribute('data-latex');
            if (latex) {
                this.insertLatex(latex);
            }

            // Handle special actions
            if (button.id === 'clearBtn') {
                this.clearExpression();
            } else if (button.id === 'backspaceBtn') {
                this.backspace();
            } else if (button.id === 'validateBtn') {
                this.validateExpression();
            } else if (button.id === 'exampleBtn') {
                this.insertExample();
            }

            // Add visual feedback
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    }

    setupToggleCalculator() {
        const toggleBtn = document.getElementById('toggleCalc');
        const calculatorBody = document.getElementById('calculatorBody');
        const calculatorHeader = document.querySelector('.calculator-header');

        if (!toggleBtn || !calculatorBody) return;

        calculatorHeader.addEventListener('click', () => {
            this.isCalculatorCollapsed = !this.isCalculatorCollapsed;
            
            if (this.isCalculatorCollapsed) {
                calculatorBody.style.maxHeight = '0';
                calculatorBody.style.padding = '0 20px';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            } else {
                calculatorBody.style.maxHeight = 'none';
                calculatorBody.style.padding = '20px';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            }
        });
    }

    setupHistoryButtons() {
        const historyItems = document.getElementById('historyItems');
        if (!historyItems) return;

        historyItems.addEventListener('click', (e) => {
            const useBtn = e.target.closest('.use-btn');
            if (!useBtn) return;

            const historyItem = useBtn.closest('.history-item');
            const expression = historyItem.getAttribute('data-expression');
            
            if (expression) {
                this.setExpression(expression);
            }
        });
    }

    setupValidation() {
        // Real-time validation as user types
        if (this.mathField) {
            this.mathField.addEventListener('input', () => {
                this.validateExpressionReal();
            });
        }
    }

    insertLatex(latex) {
        if (!this.mathField) return;

        // Special handling for different LaTeX commands
        let insertText = latex;
        
        switch (latex) {
            case '^{2}':
                this.mathField.executeCommand('moveToMathFieldEnd');
                this.mathField.executeCommand('moveToPreviousChar');
                this.mathField.insert('^2');
                break;
            case '^{3}':
                this.mathField.executeCommand('moveToMathFieldEnd');
                this.mathField.executeCommand('moveToPreviousChar');
                this.mathField.insert('^3');
                break;
            case '^{\\placeholder{}}':
                this.mathField.insert('^{#?}');
                break;
            case '\\sin\\left(\\right)':
                this.mathField.insert('\\sin(#?)');
                break;
            case '\\cos\\left(\\right)':
                this.mathField.insert('\\cos(#?)');
                break;
            case '\\tan\\left(\\right)':
                this.mathField.insert('\\tan(#?)');
                break;
            case '\\ln\\left(\\right)':
                this.mathField.insert('\\ln(#?)');
                break;
            case '\\log\\left(\\right)':
                this.mathField.insert('\\log(#?)');
                break;
            case '\\sqrt{\\placeholder{}}':
                this.mathField.insert('\\sqrt{#?}');
                break;
            case '\\sqrt[3]{\\placeholder{}}':
                this.mathField.insert('\\sqrt[3]{#?}');
                break;
            case 'e^{\\placeholder{}}':
                this.mathField.insert('e^{#?}');
                break;
            case '\\frac{\\placeholder{}}{\\placeholder{}}':
                this.mathField.insert('\\frac{#?}{#?}');
                break;
            case '\\left(\\right)':
                this.mathField.insert('(#?)');
                break;
            case '\\cdot':
                this.mathField.insert('\\cdot');
                break;
            case '\\div':
                this.mathField.insert('\\div');
                break;
            default:
                this.mathField.insert(latex);
        }

        this.mathField.focus();
        this.onMathFieldChange();
    }

    clearExpression() {
        if (this.mathField) {
            this.mathField.value = '';
            this.mathField.focus();
            this.onMathFieldChange();
        }
    }

    backspace() {
        if (this.mathField) {
            this.mathField.executeCommand('deleteBackward');
            this.onMathFieldChange();
        }
    }

    setExpression(latexExpression) {
        if (this.mathField) {
            // Convert common expressions to LaTeX
            let latex = this.convertToLatex(latexExpression);
            this.mathField.value = latex;
            this.mathField.focus();
            this.onMathFieldChange();
        }
    }

    convertToLatex(expression) {
        // Convert common mathematical expressions to LaTeX
        let latex = expression;
        
        // Handle powers
        latex = latex.replace(/\^(\d+)/g, '^{$1}');
        latex = latex.replace(/\^([a-zA-Z]+)/g, '^{$1}');
        
        // Handle functions
        latex = latex.replace(/sin\(/g, '\\sin(');
        latex = latex.replace(/cos\(/g, '\\cos(');
        latex = latex.replace(/tan\(/g, '\\tan(');
        latex = latex.replace(/log\(/g, '\\log(');
        latex = latex.replace(/ln\(/g, '\\ln(');
        latex = latex.replace(/sqrt\(/g, '\\sqrt{');
        latex = latex.replace(/exp\(/g, 'e^{');
        
        // Handle special cases
        latex = latex.replace(/pi/g, '\\pi');
        latex = latex.replace(/\* /g, '\\cdot ');
        
        return latex;
    }

    onMathFieldChange() {
        if (!this.mathField) return;

        // Convert LaTeX to Python-compatible expression
        const latexValue = this.mathField.value;
        const pythonExpression = this.convertToPython(latexValue);
        
        // Update hidden input
        const hiddenInput = document.getElementById('function');
        if (hiddenInput) {
            hiddenInput.value = pythonExpression;
        }

        // Store current function for graphs
        if (window.currentFunction !== undefined) {
            window.currentFunction = pythonExpression;
        }

        // Real-time validation
        this.validateExpressionReal();
    }

    convertToPython(latex) {
        if (!latex) return '';

        let python = latex;
        
        // Remove LaTeX commands and convert to Python syntax
        python = python.replace(/\\sin/g, 'sin');
        python = python.replace(/\\cos/g, 'cos');
        python = python.replace(/\\tan/g, 'tan');
        python = python.replace(/\\ln/g, 'log');
        python = python.replace(/\\log/g, 'log10');
        python = python.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
        python = python.replace(/\\sqrt\[3\]\{([^}]+)\}/g, 'cbrt($1)');
        python = python.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
        python = python.replace(/\\pi/g, 'pi');
        python = python.replace(/\\cdot/g, '*');
        python = python.replace(/\\div/g, '/');
        python = python.replace(/\\left\(/g, '(');
        python = python.replace(/\\right\)/g, ')');
        
        // Handle powers - convert LaTeX syntax to Python
        python = python.replace(/\^?\{([^}]+)\}/g, '**($1)');
        python = python.replace(/\^(\w+)/g, '**$1');
        python = python.replace(/\^(\d+)/g, '**$1');
        
        // Handle implicit multiplication
        python = python.replace(/(\d+)([a-zA-Z])/g, '$1*$2');
        python = python.replace(/([a-zA-Z])(\d+)/g, '$1*$2');
        python = python.replace(/\)(\w)/g, ')*$1');
        python = python.replace(/(\w)\(/g, '$1*(');
        
        // Clean up extra spaces and characters
        python = python.replace(/\s+/g, '');
        python = python.replace(/\{|\}/g, '');
        
        return python;
    }

    validateExpressionReal() {
        const statusElement = document.getElementById('validationStatus');
        if (!statusElement) return;

        const expression = document.getElementById('function').value;
        
        if (!expression) {
            statusElement.textContent = '';
            statusElement.className = 'validation-status';
            return;
        }

        try {
            // Try to parse with Math.js
            const node = math.parse(expression);
            statusElement.textContent = '✓ Válida';
            statusElement.className = 'validation-status valid';
        } catch (error) {
            statusElement.textContent = '✗ Inválida';
            statusElement.className = 'validation-status invalid';
        }
    }

    validateExpression() {
        const expression = document.getElementById('function').value;
        
        if (!expression) {
            this.showNotification('Digite uma expressão primeiro!', 'warning');
            return false;
        }

        try {
            const node = math.parse(expression);
            this.showNotification('Expressão válida! ✓', 'success');
            this.addToHistory(expression);
            return true;
        } catch (error) {
            this.showNotification('Expressão inválida: ' + error.message, 'error');
            return false;
        }
    }

    insertExample() {
        const examples = [
            'x^3 - x - 2',
            'sin(x) - 0.5',
            'e^x - 2',
            'x^2 - 4',
            'log(x) - 1',
            'sqrt(x) - 2',
            'x^2 + 2*x + 1',
            'cos(x) + x'
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        this.setExpression(randomExample);
        this.showNotification('Exemplo inserido!', 'info');
    }

    addToHistory(expression) {
        if (!this.expressionHistory.includes(expression)) {
            this.expressionHistory.unshift(expression);
            if (this.expressionHistory.length > 5) {
                this.expressionHistory.pop();
            }
            this.saveExpressionHistory();
            this.updateHistoryDisplay();
        }
    }

    loadExpressionHistory() {
        try {
            const saved = localStorage.getItem('mathCalculatorHistory');
            if (saved) {
                this.expressionHistory = JSON.parse(saved);
                this.updateHistoryDisplay();
            }
        } catch (error) {
            console.log('Could not load history');
        }
    }

    saveExpressionHistory() {
        try {
            localStorage.setItem('mathCalculatorHistory', JSON.stringify(this.expressionHistory));
        } catch (error) {
            console.log('Could not save history');
        }
    }

    updateHistoryDisplay() {
        const historyItems = document.getElementById('historyItems');
        if (!historyItems) return;

        historyItems.innerHTML = '';
        
        this.expressionHistory.forEach(expression => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.setAttribute('data-expression', expression);
            
            historyItem.innerHTML = `
                <span class="expression">${this.formatExpressionForDisplay(expression)}</span>
                <button class="use-btn" title="Usar esta expressão">
                    <i class="fas fa-arrow-up"></i>
                </button>
            `;
            
            historyItems.appendChild(historyItem);
        });
    }

    formatExpressionForDisplay(expression) {
        let display = expression;
        display = display.replace(/\*\*/g, '^');
        display = display.replace(/\*/g, '×');
        display = display.replace(/sqrt/g, '√');
        display = display.replace(/pi/g, 'π');
        return display;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for MathLive to be available
    if (typeof MathfieldElement !== 'undefined') {
        window.mathCalculator = new MathCalculator();
    } else {
        // Wait a bit more for MathLive to load
        setTimeout(() => {
            if (typeof MathfieldElement !== 'undefined') {
                window.mathCalculator = new MathCalculator();
            }
        }, 1000);
    }
});