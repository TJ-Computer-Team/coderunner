package subcode;
import java.io.*;
import java.util.StringTokenizer;

public class test {
	public static void main(String[] args) throws IOException {
		BufferedReader r = new BufferedReader(new InputStreamReader(System.in));
		PrintWriter pw = new PrintWriter(System.out);

		StringTokenizer st = new StringTokenizer(r.readLine());
		int sizeo = Integer.parseInt(st.nextToken());
		int move = Integer.parseInt(st.nextToken());
		StringTokenizer sk = new StringTokenizer(r.readLine());
		int[] orig = new int[sizeo];
		StringTokenizer l = new StringTokenizer(r.readLine());
		int[] newS = new int[sizeo];
		int[] diff = new int[sizeo];
		for(int i = 0; i < sizeo; i++)
		{
			orig[i] = Integer.parseInt(sk.nextToken());
			newS[i] = Integer.parseInt(l.nextToken());
			diff[i] = newS[i] - orig[i];
		}
		int diffSum = 0;
		for(int i = 0; i < sizeo; i++)
		{
			if(diff[i] % move != 0)
			{
				pw.println("NO");
				pw.close();
				break;	
			} else
			{
				diffSum += diff[i];
			}
		}
		if(diffSum != 0)
		{
			pw.println("NO");
			pw.close();
		}
		pw.println("YES");
		int moves = 0;
		for(int i = 0; i < sizeo; i++)
		{
			if(diff[i] > 0)
			{
				moves += diff[i];
			}
		}
		pw.print(moves/move);
		pw.close();
	}
}