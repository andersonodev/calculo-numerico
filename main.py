"""
Arquivo principal da aplicação.
Importa a aplicação Flask do módulo app para ser executada.
"""

from app import app
import sys

if __name__ == '__main__':
    # Permite definir a porta via argumento de linha de comando
    port = 8080  # Alterado de 5000 para 8080 para evitar conflito com AirPlay no macOS
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print('Uso: python3 main.py [porta]')
            sys.exit(1)
    print(f"Iniciando servidor na porta {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
