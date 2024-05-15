import java.util.*;
import java.io.*;

public class test {
    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        
        int x  = scan.nextInt();
        int y  = scan.nextInt();
        int a  = scan.nextInt();
        int b  = scan.nextInt();
        int temp;
        int time = 0;
        
        if (x >= y) {
            temp = x;
            x = y;
            y = temp; 
        }

        if (b >= a) {
            temp = a;
            a = b;
            b = temp; 
        }

        if (a > x) {
            temp = a;
            a = b;
            b = temp;
        }

        // System.out.println(x);
        // System.out.println(y);
        // System.out.println(a);
        // System.out.println(b);

        if (x < a || y < b) {
            System.out.println(-1);
            return;
        }

        if (y != b) {
            time += x;
        }

        if (x != a) {
            time += b;
        }

        System.out.println("\n" + time);
    }
}
