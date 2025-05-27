"""
Aplicação Flask para cálculo de raízes de funções usando métodos numéricos.
Implementa uma API REST para os métodos de Newton-Raphson e Falsa Posição.
"""

import os
import logging
from flask import Flask, render_template, request, jsonify
from numerical_methods import false_position, newton_raphson
import json

# Configuração do logging
logging.basicConfig(level=logging.DEBUG)

# Classe personalizada para serialização JSON
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bool):
            return int(obj)  # Converte True para 1, False para 0
        try:
            return json.JSONEncoder.default(self, obj)
        except TypeError:
            return str(obj)  # Converte outros tipos não serializáveis para string

# Configuração do encoder personalizado
app = Flask(__name__)
app.json_encoder = CustomJSONEncoder
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

@app.route('/')
def index():
    """
    Renderiza a página principal da aplicação.
    
    Returns:
        str: Template HTML renderizado
    """
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    """
    Endpoint para realizar cálculos usando métodos numéricos.
    
    Recebe dados JSON com:
    - function: string da função matemática
    - method: método a ser usado ('newton' ou 'falsa_posicao')
    - tolerance: tolerância para convergência
    - max_iterations: número máximo de iterações
    - x0: ponto inicial (apenas para Newton-Raphson)
    - a, b: limites do intervalo (apenas para Falsa Posição)
    
    Returns:
        JSON: Resultados do cálculo ou mensagem de erro
    """
    try:
        data = request.get_json()
        
        # Extrai parâmetros
        function_str = data.get('function', '').strip()
        method = data.get('method', '').strip()
        tolerance = float(data.get('tolerance', 1e-6))
        max_iterations = int(data.get('max_iterations', 100))
        
        # Valida entradas
        if not function_str:
            return jsonify({'error': 'Por favor, insira uma função válida'}), 400
        
        if method not in ['newton', 'falsa_posicao']:
            return jsonify({'error': 'Método inválido. Use "newton" ou "falsa_posicao"'}), 400
        
        if tolerance <= 0:
            return jsonify({'error': 'A tolerância deve ser um valor positivo'}), 400
        
        if max_iterations <= 0:
            return jsonify({'error': 'O número máximo de iterações deve ser positivo'}), 400
        
        # Validação e cálculo específicos para cada método
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
        
        # Converter explicitamente valores booleanos para inteiros antes da serialização
        # Esta é a parte crucial para resolver o problema
        processed_result = json.loads(json.dumps(result, cls=CustomJSONEncoder))
        return jsonify(processed_result)
        
    except ValueError as e:
        return jsonify({'error': f'Erro nos valores inseridos: {str(e)}'}), 400
    except Exception as e:
        app.logger.error(f"Erro no cálculo: {str(e)}")
        return jsonify({'error': f'Erro no cálculo: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    """
    Manipulador de erro para endpoints não encontrados.
    
    Args:
        error: Objeto de erro
        
    Returns:
        JSON: Mensagem de erro 404
    """
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    """
    Manipulador de erro para erros internos do servidor.
    
    Args:
        error: Objeto de erro
        
    Returns:
        JSON: Mensagem de erro 500
    """
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
