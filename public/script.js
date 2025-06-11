  // Precompute factorials
    const factorials = Array.from({ length: 11 }, (_, n) => {
      if (n === 0) return 1;
      let result = 1;
      for (let i = 1; i <= n; i++) result *= i;
      return result;
    });

    // Cache x-values
    const xValues = [];
    for (let x = -10; x <= 10; x += 0.2) {
      xValues.push(parseFloat(x.toFixed(2)));
    }

    // WebAssembly module
    let wasmModule;
    let isWasmLoaded = false;
    let isGraphInitialized = false;

    // Wait for WebAssembly and DOM to load
    document.addEventListener('DOMContentLoaded', () => {
      Module().then(module => {
        wasmModule = module;
        isWasmLoaded = true;
        renderLatexContent(); // Render LaTeX once
        updateGraph(); // Initial render
      }).catch(err => {
        console.error('Failed to load WebAssembly module:', err);
      });
    });

    // Render LaTeX content once
    function renderLatexContent() {
      const latexContent = {
        whatIsTaylor: `A Taylor series is a way to represent a function as an infinite sum of polynomials, centered at a point \\( a \\). It's a powerful tool for approximating complex functions (like \\( \\sin(x) \\), \\( \\cos(x) \\), or \\( e^x \\)) using polynomials, which are easier to compute, differentiate, and integrate. Taylor series are crucial in fields like physics and engineering. For example, approximating \\( \\cos(\\theta) \\approx 1 - \\frac{\\theta^2}{2} \\) simplifies pendulum problems by making equations more manageable.`,
        whyImportant: `Taylor series translate derivative information at a single point into an approximation of the function near that point. They're used in physics (e.g., pendulum energy), engineering (e.g., signal processing), and numerical methods because polynomials are computationally friendly. The more terms you include, the closer the approximation, but there's a tradeoff with complexity. For functions like \\( e^x \\), the series converges for all \\( x \\), while others, like \\( \\ln(x) \\), have a limited radius of convergence.`,
        howCalculate: `The Taylor series for a function \\( f(x) \\) centered at \\( a \\) is computed by:
<ol>
  <li>Finding the function's derivatives: \\( f(a) \\), \\( f'(a) \\), \\( f''(a) \\), \\cdots, \\( f^{(n)}(a) \\).</li>
  <li>Evaluating each derivative at \\( x = a \\).</li>
  <li>Dividing each by \\( n! \\) (factorial) to get the coefficient of \\( (x - a)^n \\).</li>
  <li>Summing the terms: \\( f(a) + f'(a)(x - a) + \\frac{f''(a)}{2!}(x - a)^2 + \\cdots \\).</li>
</ol>`,
        generalFormula: `f(x) \\approx \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x - a)^n = f(a) + f'(a)(x - a) + \\frac{f''(a)}{2!}(x - a)^2 + \\cdots`,
        sinExample: `For example, for \\( f(x) = \\sin(x) \\) at \\( a = 0 \\):
<ul>
  <li>\\(\\sin(0) = 0\\), \\(\\cos(0) = 1\\), \\(-\\sin(0) = 0\\), \\(-\\cos(0) = -1\\).</li>
  <li>Coefficients: \\( 0 \\), \\( \\frac{1}{1!} \\), \\( \\frac{0}{2!} \\), \\( \\frac{-1}{3!} \\), \\ldots.</li>
  <li>Series: \\( x - \\frac{x^3}{6} + \\frac{x^5}{120} - \\cdots \\).</li>
</ul>`,
        howDerived: `The Taylor series matches a polynomial's value, slope, and higher-order derivatives to those of \\( f(x) \\) at \\( x = a \\). For a polynomial \\( P_n(x) = c_0 + c_1(x - a) + c_2(x - a)^2 + \\cdots \\):
<ul>
  <li>At \\( x = a \\), \\( P_n(a) = c_0 \\), so set \\( c_0 = f(a) \\).</li>
  <li>First derivative: \\( P_n'(x) = c_1 + 2c_2(x - a) + \\cdots \\), so \\( P_n'(a) = c_1 = f'(a) \\).</li>
  <li>Second derivative: \\( P_n''(x) = 2c_2 + \\cdots \\), so \\( P_n''(a) = 2c_2 = f''(a) \\), thus \\( c_2 = \\frac{f''(a)}{2!} \\).</li>
  <li>Generally, \\( c_n = \\frac{f^{(n)}(a)}{n!} \\).</li>`,
        effectTerms: `Adding more terms (increasing \\( n \\)) makes the Taylor polynomial closer to \\( f(x) \\) near \\( a \\). Each term accounts for a higher-order derivative, refining how the polynomial's slope and curvature match the function. For example, the series for \\( \\cos(x) \\) at \\( a = 0 \\) starts as \\( 1 - \\frac{x^2}{2} \\), then adds \\( \\frac{x^4}{24} \\), improving accuracy. However, the series may only converge within a certain radius of convergence (e.g., \\( \\ln(x) \\) converges for \\( 0 < x \\leq 2 \\) when centered at \\( a = 1 \\)). Explore this visualizer to see how the polynomial “hugs” the function!`
      };

      // Function to process LaTeX within HTML content
      function renderWithLatex(elementId, content) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Split content into parts to handle HTML and LaTeX separately
        let renderedContent = content.replace(/\\\((.*?)\\\)/g, (match, latex) => {
          try {
            return katex.renderToString(latex, { throwOnError: false, displayMode: false });
          } catch (e) {
            console.error(`KaTeX error in ${elementId}:`, e);
            return match;
          }
        });

        // Handle display mode LaTeX
        renderedContent = renderedContent.replace(/\\\[(.+?)\\\]/g, (match, latex) => {
          try {
            return katex.renderToString(latex, { throwOnError: false, displayMode: true });
          } catch (e) {
            console.error(`KaTeX error in ${elementId}:`, e);
            return match;
          }
        });

        // Set the rendered content
        element.innerHTML = renderedContent;
      }

      // Render each section
      Object.keys(latexContent).forEach(key => {
        renderWithLatex(key, latexContent[key]);
      });
    }

    // Evaluate original function
    function evaluateFunction(func, x) {
      try {
        const result = math.evaluate(func, { x });
        return isFinite(result) ? result : 0;
      } catch (e) {
        console.error(`Error evaluating ${func} at x=${x}:`, e);
        return 0;
      }
    }

    // Debounce updates
    let debounceTimeout;
    function debounceUpdateGraph() {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(updateGraph, 50);
    }

    // Update graph and polynomial
    function updateGraph() {
      if (!isWasmLoaded) {
        console.log('WebAssembly not loaded yet, skipping update');
        return;
      }

      const func = document.getElementById('functionSelect').value;
      const terms = parseInt(document.getElementById('terms').value);
      const center = parseFloat(document.getElementById('center').value);
      document.getElementById('termsValue').textContent = terms;
      document.getElementById('centerValue').textContent = center.toFixed(1);

      // Generate data
      const originalData = xValues.map(x => evaluateFunction(func, x));
      const taylorData = xValues.map(x => {
        try {
          let result;
          if (func === 'sin(x)') {
            result = wasmModule._taylorSin(x, center, terms);
          } else if (func === 'cos(x)') {
            result = wasmModule._taylorCos(x, center, terms);
          } else if (func === 'exp(x)') {
            result = wasmModule._taylorExp(x, center, terms);
          } else {
            result = 0;
          }
          return isFinite(result) ? result : 0;
        } catch (e) {
          console.error(`Error computing Taylor for ${func} at x=${x}:`, e);
          return 0;
        }
      });

      // Configure axes (same for all functions)
      const tickvals = [-3*Math.PI, -5*Math.PI/2, -2*Math.PI, -3*Math.PI/2, -Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI, 5*Math.PI/2, 3*Math.PI];
      const ticktext = ['-3π', '-5π/2', '-2π', '-3π/2', '-π', '-π/2', '0', 'π/2', 'π', '3π/2', '2π', '5π/2', '3π'];

// Update Plotly graph
      const traces = [
        {
          x: xValues,
          y: originalData,
          type: 'scatter',
          mode: 'lines',
          name: `Original ${func}`,
          line: { color: '#5b42f3', width: 2 }
        },
        {
          x: xValues,
          y: taylorData,
          type: 'scatter',
          mode: 'lines',
          name: `Taylor Polynomial (n=${terms})`,
          line: { color: '#a8a1d6', width: 2 }
        }
      ];

      const layout = {
        margin: { t: 20, b: 50, l: 50, r: 20 },
        xaxis: {
          title: 'x',
          range: [-Math.PI, Math.PI],
          gridcolor: '#3a2b4d',
          zerolinecolor: '#e6e1f5',
          zerolinewidth: 2,
          tickvals: tickvals,
          ticktext: ticktext,
          tickfont: { color: '#e6e1f5' }
        },
        yaxis: {
          title: 'y',
          range: [-2, 2],
          gridcolor: '#3a2b4d',
          zerolinecolor: '#e6e1f5',
          zerolinewidth: 2,
          tickfont: { color: '#e6e1f5' },
          scaleanchor: 'x',
          scaleratio: Math.PI
        },
        plot_bgcolor: '#180a22',
        paper_bgcolor: '#180a22',
        font: { color: '#e6e1f5', size: 12 },
        showlegend: true,
        legend: { x: 0, y: 1.1, orientation: 'h', font: { color: '#e6e1f5' } },
        dragmode: 'pan',
        hovermode: 'closest'
      };

      if (!isGraphInitialized) {
        Plotly.newPlot('taylorGraph', traces, layout, { responsive: true });
        isGraphInitialized = true;
      } else {
        Plotly.react('taylorGraph', traces, layout);
      }

      // Render LaTeX polynomial
      let polynomialLatex = '';
      if (func === 'sin(x)') {
        polynomialLatex = generateSinPolynomialLatex(terms, center);
      } else if (func === 'cos(x)') {
        polynomialLatex = generateCosPolynomialLatex(terms, center);
      } else if (func === 'exp(x)') {
        polynomialLatex = generateExpPolynomialLatex(terms, center);
      }
      try {
        katex.render(`P_n(x) = ${polynomialLatex || '0'}`, document.getElementById('polynomial'), {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        console.error('Error rendering polynomial LaTeX:', e);
      }
    }

    // Generate LaTeX polynomials
    function generateSinPolynomialLatex(n, a) {
      let terms = [];
      for (let k = 0; k <= n; k++) {
        const coef = k % 2 === 0 ? Math.cos(a) : Math.sin(a);
        const sign = (k % 4 === 0 || k % 4 === 3) ? '' : '-';
        const power = k === 0 ? '' : k === 1 ? `(x - ${a.toFixed(1)})` : `(x - ${a.toFixed(1)})^{${k}}`;
        const denom = k === 0 ? '' : k === 1 ? '' : `\\frac{${Math.abs(coef).toFixed(2)}}{${factorials[k]}}`;
        const term = (k === 0 || k === 1) ? `${sign}${Math.abs(coef).toFixed(2)}${power}` : `${sign}${denom}${power}`;
        if (Math.abs(coef) > 0.01) terms.push(term);
      }
      return terms.join(' + ') || '0';
    }

    function generateCosPolynomialLatex(n, a) {
      let terms = [];
      for (let k = 0; k <= n; k++) {
        const coef = k % 2 === 0 ? Math.cos(a) : -Math.sin(a);
        const sign = (k % 4 === 0 || k % 4 === 3) ? '' : '-';
        const power = k === 0 ? '' : k === 1 ? `(x - ${a.toFixed(1)})` : `(x - ${a.toFixed(1)})^{${k}}`;
        const denom = k === 0 ? '' : k === 1 ? '' : `\\frac{${Math.abs(coef).toFixed(2)}}{${factorials[k]}}`;
        const term = (k === 0 || k === 1) ? `${sign}${Math.abs(coef).toFixed(2)}${power}` : `${sign}${denom}${power}`;
        if (Math.abs(coef) > 0.01) terms.push(term);
      }
      return terms.join(' + ') || '0';
    }

    function generateExpPolynomialLatex(n, a) {
      let terms = [];
      const ea = Math.exp(a).toFixed(2);
      for (let k = 0; k <= n; k++) {
        const power = k === 0 ? '' : k === 1 ? `(x - ${a.toFixed(1)})` : `(x - ${a.toFixed(1)})^{${k}}`;
        const term = k === 0 ? `${ea}` : k === 1 ? `${ea}${power}` : `\\frac{${ea}}{${factorials[k]}}${power}`;
        terms.push(term);
      }
      return terms.join(' + ') || '0';
    }

    // Reset graph
    function resetGraph() {
      document.getElementById('terms').value = 1;
      document.getElementById('center').value = 0;
      document.getElementById('functionSelect').value = 'sin(x)';
      updateGraph();
    }

    // Attach debounced event listeners
    document.getElementById('terms').addEventListener('input', debounceUpdateGraph);
    document.getElementById('center').addEventListener('input', debounceUpdateGraph);
    document.getElementById('functionSelect').addEventListener('change', debounceUpdateGraph);