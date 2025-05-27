import sympy as sp
import numpy as np
import time
from typing import Dict, List, Any

def parse_function(function_str: str):
    """Parse a string function into a SymPy expression"""
    try:
        # Define the variable
        x = sp.Symbol('x')
        
        # Replace common mathematical functions and symbols for compatibility
        function_str = function_str.replace('^', '**')  # Convert ^ to ** for power
        function_str = function_str.replace('ln', 'log')  # Natural logarithm
        function_str = function_str.replace('pi', 'PI')  # Pi constant
        function_str = function_str.replace('e', 'E')  # Euler's number (be careful with variables)
        
        # Handle special cases for e as Euler's number vs variable e
        # Only replace standalone 'e' not part of other words like 'exp'
        import re
        function_str = re.sub(r'\be\b', 'E', function_str)
        
        # Parse the expression
        expr = sp.sympify(function_str)
        
        # Convert to numerical function
        f = sp.lambdify(x, expr, 'numpy')
        
        return expr, f, x
    except Exception as e:
        raise ValueError(f"Erro ao interpretar a função: {str(e)}. Verifique a sintaxe matemática.")

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
        xr = 0
        fxr = 0
        relative_error = float('inf')
        
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
            
            # Check convergence - using relative error as percentage
            if i > 0 and relative_error <= tolerance / 100.0:
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
            'converged': relative_error <= tolerance,
            'execution_time': round(execution_time, 6),
            'total_iterations': len(iterations)
        }
        
    except Exception as e:
        raise ValueError(f"Erro no método da Falsa Posição: {str(e)}")

def newton_raphson(function_str: str, x0: float, tolerance: float, max_iterations: int) -> Dict[str, Any]:
    """
    Implement the Newton-Raphson method based on Taylor series
    Formula: x(i+1) = xi - f(xi)/f'(xi)
    
    According to theory:
    - Based on tangent line equation at point xi
    - Uses derivative calculated analytically
    - Relative error calculation: |xr - xr-1|/xr * 100%
    """
    start_time = time.time()
    
    try:
        expr, f, x = parse_function(function_str)
        
        # Calculate derivative symbolically using SymPy
        df_expr = sp.diff(expr, x)
        df = sp.lambdify(x, df_expr, 'numpy')
        
        iterations = []
        xi = x0
        converged = False
        relative_error_percent = float('inf')
        
        for i in range(max_iterations):
            # Evaluate function and derivative at current point
            fxi = f(xi)
            dfxi = df(xi)
            
            # Check if derivative is zero (critical point)
            if abs(dfxi) < 1e-14:
                raise ValueError(f"Derivada f'(x) = 0 na iteração {i+1}. Ponto crítico encontrado - método não pode convergir.")
            
            # Calculate next approximation using Newton-Raphson formula
            # xi+1 = xi - f(xi)/f'(xi)
            xi_new = xi - fxi / dfxi
            
            # Calculate relative error according to theory: |xi+1 - xi|/xi+1 * 100%
            if xi_new != 0:
                relative_error_percent = abs((xi_new - xi) / xi_new) * 100
                relative_error = relative_error_percent / 100  # For comparison with tolerance
            else:
                relative_error_percent = float('inf')
                relative_error = float('inf')
            
            # Calculate absolute error
            absolute_error = abs(xi_new - xi)
            
            # Evaluate function at new point
            fxi_new = f(xi_new)
            
            # Store iteration data (following the theory format)
            iterations.append({
                'iteration': i + 1,
                'xi': round(xi, 8),
                'xi_plus_1': round(xi_new, 8),
                'fxi': round(fxi, 8),
                'dfxi': round(dfxi, 8),
                'absolute_error': round(absolute_error, 8),
                'relative_error_percent': round(relative_error_percent, 8) if relative_error_percent != float('inf') else 'N/A'
            })
            
            # Check convergence: relative error <= tolerance (convert tolerance to decimal)
            if relative_error <= tolerance / 100.0:
                converged = True
                break
            
            # Prepare for next iteration
            xi = xi_new
        
        execution_time = time.time() - start_time
        
        # Final verification: substitute root back into original function
        final_function_value = f(xi)
        
        return {
            'method': 'Newton-Raphson',
            'root': round(xi, 8),
            'function_value': round(final_function_value, 8),
            'derivative_expression': str(df_expr),
            'initial_point': x0,
            'iterations': iterations,
            'converged': converged,
            'execution_time': round(execution_time, 6),
            'total_iterations': len(iterations),
            'convergence_type': 'Quadrática' if converged else 'Não convergiu',
            'final_relative_error': round(relative_error_percent, 8) if relative_error_percent != float('inf') and relative_error_percent is not None else 'N/A'
        }
        
    except Exception as e:
        raise ValueError(f"Erro no método de Newton-Raphson: {str(e)}")
