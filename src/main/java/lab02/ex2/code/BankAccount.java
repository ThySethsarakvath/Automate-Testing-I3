package lab02.ex2.code;

public class BankAccount {
    private double balance;

    public BankAccount(double initialBalance) {
        this.balance = initialBalance;
    }

    public double withdraw(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal must be positive");
        }
        if (amount > balance) {
            throw new IllegalStateException("Insufficient funds: Regulatory limit reached");
        }
        
        balance -= amount;
        return balance;
    }

    public double getBalance() { return balance; }
}