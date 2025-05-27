import sympy as sp
import numpy as np
import time
from typing import Dict, List, Any

def parse_function(function_str: str):
    """Parse a string function into a SymPy expression"""
    try:
        # Define the variable
        x = sp.Symbol('x')
        
        # Replace common mathematical functions for compatibility
        function_str = function_str.replace('^', '**')
        function_str = function_str.replace('ln', 'log')
        
        # Parse the expression
        expr = sp.sympify(function_str)
        
        # Convert to numerical function
        f = sp.lambdify(x, expr, 'numpy')
        
        return expr, f, x
    except Exception as e:
        raise ValueError(f"Erro ao interpretar a função: {str(e)}")

def false_position(function_str: str, a: float, b: float, tolerance: float, max_iterations: int) -> Dict[str, Any]:
    """
    Implement the False Position (Regula Falsi) method
    Formula: xr = b - f(b)(a-b)/(f(a)-f(b))
    """
    start_time = time.time()
    
    try:
        expr, f, x = parse_function(function_str)
        
        # Check if root is bracketed
        fa = f(a)
        fb = f(b)
        
        if fa * fb > 0:
            raise ValueError("A função deve ter sinais opostos nos pontos a e b para garantir a existência de uma raiz no intervalo")
        
        iterations = []
        xr_old = 0
        
        for i in range(max_iterations):
            # Calculate new approximation using False Position formula
            xr = b - (fb * (a - b)) / (fa - fb)
            fxr = f(xr)
            
            # Calculate errors
            if i > 0:
                absolute_error = abs(xr - xr_old)
                relative_error = abs((xr - xr_old) / xr) if xr != 0 else float('inf')
            else:
                absolute_error = float('inf')
                relative_error = float('inf')
            
            # Store iteration data
            iterations.append({
                'iteration': i + 1,
                'x': round(xr, 8),
                'fx': round(fxr, 8),
                'absolute_error': round(absolute_error, 8) if absolute_error != float('inf') else 'N/A',
                'relative_error': round(relative_error, 8) if relative_error != float('inf') else 'N/A'
            })
            
            # Check convergence
            if i > 0 and relative_error <= tolerance:
                break
            
            # Update interval based on sign of f(a) * f(xr)
            if fa * fxr < 0:
                b = xr
                fb = fxr
            else:
                a = xr
                fa = fxr
            
            xr_old = xr
        
        execution_time = time.time() - start_time
        
        return {
            'method': 'Falsa Posição (Regula Falsi)',
            'root': round(xr, 8),
            'function_value': round(fxr, 8),
            'iterations': iterations,
            'converged': relative_error <= tolerance if i > 0 else False,
            'execution_time': round(execution_time, 6),
            'total_iterations': len(iterations)
        }
        
    except Exception as e:
        raise ValueError(f"Erro no método da Falsa Posição: {str(e)}")

def newton_raphson(function_str: str, x0: float, tolerance: float, max_iterations: int) -> Dict[str, Any]:
    """
    Implement the Newton-Raphson method
    Formula: x(n+1) = xn - f(xn)/f'(xn)
    """
    start_time = time.time()
    
    try:
        expr, f, x = parse_function(function_str)
        
        # Calculate derivative symbolically
        df_expr = sp.diff(expr, x)
        df = sp.lambdify(x, df_expr, 'numpy')
        
        iterations = []
        xn = x0
        
        for i in range(max_iterations):
            fxn = f(xn)
            dfxn = df(xn)
            
            # Check if derivative is zero
            if abs(dfxn) < 1e-14:
                raise ValueError(f"Derivada muito próxima de zero na iteração {i+1}. O método pode não convergir.")
            
            # Calculate new approximation using Newton-Raphson formula
            xn_new = xn - fxn / dfxn
            
            # Calculate errors
            if i > 0:
                absolute_error = abs(xn_new - xn)
                relative_error = abs((xn_new - xn) / xn_new) if xn_new != 0 else float('inf')
            else:
                absolute_error = float('inf')
                relative_error = float('inf')
            
            # Store iteration data
            iterations.append({
                'iteration': i + 1,
                'x': round(xn_new, 8),
                'fx': round(f(xn_new), 8),
                'dfx': round(dfxn, 8),
                'absolute_error': round(absolute_error, 8) if absolute_error != float('inf') else 'N/A',
                'relative_error': round(relative_error, 8) if relative_error != float('inf') else 'N/A'
            })
            
            # Check convergence
            if i > 0 and relative_error <= tolerance:
                break
            
            xn = xn_new
        
        execution_time = time.time() - start_time
        
        return {
            'method': 'Newton-Raphson',
            'root': round(xn, 8),
            'function_value': round(f(xn), 8),
            'derivative_expression': str(df_expr),
            'iterations': iterations,
            'converged': relative_error <= tolerance if i > 0 else False,
            'execution_time': round(execution_time, 6),
            'total_iterations': len(iterations)
        }
        
    except Exception as e:
        raise ValueError(f"Erro no método de Newton-Raphson: {str(e)}")
