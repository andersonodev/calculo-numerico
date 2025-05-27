// Calculadora Científica com MathLive
class MathCalculator {
    constructor() {
        this.mathField = null;
        this.isCalculatorCollapsed = false;
        this.init();
    }

    init() {
        this.setupMathField();
        this.setupCalculatorButtons();
        this.setupToggleCalculator();
        this.setupValidation();
    }

    setupMathField() {
        const mathEditor = document.getElementById('mathEditor');
        if (!mathEditor) {
            console.log('MathEditor not found, creating fallback');
            return;
        }

        // Wait for MathLive to be available
        if (typeof MathfieldElement === 'undefined') {
            console.log('MathLive not loaded, using fallback input');
            this.setupFallbackInput();
            return;
        }

        try {
            // Configure MathLive
            this.mathField = mathEditor;
            
            // Set initial value (remove default value)
            this.mathField.value = '';
            
            // Configure MathLive options (modern syntax)
            this.mathField.mathVirtualKeyboardPolicy = 'off';
            this.mathField.smartFence = true;
            this.mathField.smartSuperscript = true;
            MathfieldElement.locale = 'pt-BR';

            // Listen for input changes
            this.mathField.addEventListener('input', (ev) => {
                this.onMathFieldChange();
            });

            // Update hidden input initially
            this.onMathFieldChange();
            
            console.log('MathLive initialized successfully');
        } catch (error) {
            console.log('MathLive failed, using fallback:', error);
            this.setupFallbackInput();
        }
    }

    setupFallbackInput() {
        const mathEditor = document.getElementById('mathEditor');
        if (!mathEditor) return;

        // Create a regular input as fallback
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'text';
        fallbackInput.id = 'mathEditor';
        fallbackInput.className = 'math-input fallback-input';
        fallbackInput.placeholder = 'Digite sua função: ex: x^2 + 2*x + 1';
        fallbackInput.value = ''; // Remove default value
        
        // Replace the math-field with regular input
        mathEditor.parentNode.replaceChild(fallbackInput, mathEditor);
        this.mathField = fallbackInput;
        
        // Add event listener for changes
        this.mathField.addEventListener('input', () => {
            this.onFallbackChange();
        });
        
        // Initial update
        this.onFallbackChange();
    }

    onFallbackChange() {
        if (!this.mathField) return;
        
        const expression = this.mathField.value;
        const hiddenInput = document.getElementById('function');
        if (hiddenInput) {
            hiddenInput.value = expression;
        }
        
        // Store current function for graphs
        if (window.currentFunction !== undefined) {
            window.currentFunction = expression;
        }
        
        // Real-time validation
        this.validateExpressionReal();
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

        // Iniciar com calculadora fechada por padrão
        this.isCalculatorCollapsed = true;
        calculatorBody.style.maxHeight = '0';
        calculatorBody.style.padding = '0 20px';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';

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
                // Inserir x² se não houver seleção ou aplicar à seleção atual
                if (this.mathField.selectionIsCollapsed) {
                    this.mathField.insert('x^2');
                } else {
                    this.mathField.insert('^2');
                }
                break;
            case '^{3}':
                // Inserir x³ se não houver seleção ou aplicar à seleção atual
                if (this.mathField.selectionIsCollapsed) {
                    this.mathField.insert('x^3');
                } else {
                    this.mathField.insert('^3');
                }
                break;
            case '^{\\placeholder{}}':
                // Melhorar inserção de potência genérica
                if (this.mathField.selectionIsCollapsed) {
                    this.mathField.insert('x^{#?}');
                } else {
                    this.mathField.insert('^{#?}');
                }
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
            // Simple validation - check for basic mathematical syntax
            if (typeof math !== 'undefined' && math.parse) {
                const node = math.parse(expression);
                statusElement.textContent = '✓ Válida';
                statusElement.className = 'validation-status valid';
            } else {
                // Fallback validation
                this.simpleValidation(expression, statusElement);
            }
        } catch (error) {
            statusElement.textContent = '✗ Inválida';
            statusElement.className = 'validation-status invalid';
        }
    }

    simpleValidation(expression, statusElement) {
        // Basic validation without math.js
        if (!expression || expression.trim() === '') {
            statusElement.textContent = '';
            statusElement.className = 'validation-status';
            return;
        }

        // Check for basic patterns
        const invalidChars = /[^x\d\+\-\*\/\^\(\)\.\s\w]/;
        const hasVariable = /\bx\b/.test(expression);
        const balancedParens = this.checkBalancedParentheses(expression);

        if (invalidChars.test(expression.replace(/sin|cos|tan|log|sqrt|pi|exp/g, ''))) {
            statusElement.textContent = '✗ Caracteres inválidos';
            statusElement.className = 'validation-status invalid';
        } else if (!hasVariable) {
            statusElement.textContent = '⚠ Adicione variável x';
            statusElement.className = 'validation-status invalid';
        } else if (!balancedParens) {
            statusElement.textContent = '✗ Parênteses desbalanceados';
            statusElement.className = 'validation-status invalid';
        } else {
            statusElement.textContent = '✓ Válida';
            statusElement.className = 'validation-status valid';
        }
    }

    checkBalancedParentheses(expression) {
        let count = 0;
        for (let char of expression) {
            if (char === '(') count++;
            if (char === ')') count--;
            if (count < 0) return false;
        }
        return count === 0;
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