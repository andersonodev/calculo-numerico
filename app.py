import os
import logging
from flask import Flask, render_template, request, jsonify
from numerical_methods import false_position, newton_raphson
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    """Handle numerical method calculations"""
    try:
        data = request.get_json()
        
        # Extract parameters
        function_str = data.get('function', '').strip()
        method = data.get('method', '').strip()
        tolerance = float(data.get('tolerance', 1e-6))
        max_iterations = int(data.get('max_iterations', 100))
        
        # Validate inputs
        if not function_str:
            return jsonify({'error': 'Por favor, insira uma função válida'}), 400
        
        if method not in ['newton', 'falsa_posicao']:
            return jsonify({'error': 'Método inválido. Use "newton" ou "falsa_posicao"'}), 400
        
        if tolerance <= 0:
            return jsonify({'error': 'A tolerância deve ser um valor positivo'}), 400
        
        if max_iterations <= 0:
            return jsonify({'error': 'O número máximo de iterações deve ser positivo'}), 400
        
        # Method-specific parameter validation and calculation
        if method == 'newton':
            x0 = data.get('x0')
            if x0 is None:
                return jsonify({'error': 'Para o método de Newton-Raphson, o ponto inicial x0 é obrigatório'}), 400
            
            x0 = float(x0)
            result = newton_raphson(function_str, x0, tolerance, max_iterations)
            
        elif method == 'falsa_posicao':
            a = data.get('a')
            b = data.get('b')
            if a is None or b is None:
                return jsonify({'error': 'Para o método da Falsa Posição, os limites a e b são obrigatórios'}), 400
            
            a = float(a)
            b = float(b)
            
            if a >= b:
                return jsonify({'error': 'O limite inferior (a) deve ser menor que o limite superior (b)'}), 400
            
            result = false_position(function_str, a, b, tolerance, max_iterations)
        
        return jsonify(result)
        
    except ValueError as e:
        return jsonify({'error': f'Erro nos valores inseridos: {str(e)}'}), 400
    except Exception as e:
        app.logger.error(f"Erro no cálculo: {str(e)}")
        return jsonify({'error': f'Erro no cálculo: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
