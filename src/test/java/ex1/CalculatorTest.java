package ex1;

import org.junit.jupiter.api.Test;
import lab02.ex1.code.Calculator;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

public class CalculatorTest {
    Calculator calc = new Calculator();

    @Test
    @DisplayName("Blackbox: Basic Arithmetic Correctness")
    void testBasicOperations() {
        assertEquals(10, calc.add(7, 3));
        assertEquals(4, calc.subtract(10, 6));
        assertEquals(15, calc.multiply(3, 5));
    }

    @Test
    @DisplayName("Whitebox: Branch Coverage & Exception Paths")
    void testDivisionByZero() {
        Exception exception = assertThrows(ArithmeticException.class, () -> {
            calc.divide(10, 0);
        });
        
        assertEquals("Division by zero is not allowed", exception.getMessage());
    }

    @Test
    @DisplayName("Blackbox: Edge Case - Large Numbers")
    void testEdgeCases() {
        assertEquals(2000000, calc.add(1000000, 1000000));
    }
}