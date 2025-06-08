#include <emscripten.h>
#include <cmath>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  double taylorSin(double x, double a, int n) {
    double result = 0.0;
    for (int k = 0; k <= n; k++) {
      if (k % 2 == 0) {
        double term = std::cos(a);
        for (int i = 0; i < k; i++) term *= (x - a);
        for (int i = 1; i <= k; i++) term /= i;
        if ((k/2) % 2 == 0) {
          result += term;
        } else {
          result -= term;
        }
      } else {
        double term = std::sin(a);
        for (int i = 0; i < k; i++) term *= (x - a);
        for (int i = 1; i <= k; i++) term /= i;
        if ((k-1)/2 % 2 == 0) {
          result += term;
        } else {
          result -= term;
        }
      }
    }
    return result;
  }

  EMSCRIPTEN_KEEPALIVE
  double taylorCos(double x, double a, int n) {
    double result = 0.0;
    for (int k = 0; k <= n; k++) {
      if (k % 2 == 0) {
        double term = std::cos(a);
        for (int i = 0; i < k; i++) term *= (x - a);
        for (int i = 1; i <= k; i++) term /= i;
        if ((k/2) % 2 == 0) {
          result += term;
        } else {
          result -= term;
        }
      } else {
        double term = -std::sin(a);
        for (int i = 0; i < k; i++) term *= (x - a);
        for (int i = 1; i <= k; i++) term /= i;
        if ((k-1)/2 % 2 == 0) {
          result += term;
        } else {
          result -= term;
        }
      }
    }
    return result;
  }

  EMSCRIPTEN_KEEPALIVE
  double taylorExp(double x, double a, int n) {
    double result = 0.0;
    double ea = std::exp(a);
    for (int k = 0; k <= n; k++) {
      double term = ea;
      for (int i = 0; i < k; i++) term *= (x - a);
      for (int i = 1; i <= k; i++) term /= i;
      result += term;
    }
    return result;
  }
}