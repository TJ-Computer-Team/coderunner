package a;
import java.util.*;
import java.io.*;
public class b{

   public static void main(String[] args) {
      Scanner in = new Scanner(System.in);
      int A = in.nextInt();
      int B = in.nextInt();
      int ans = 2 * A + B;
      System.out.println(ans);
      in.close();
   }
}