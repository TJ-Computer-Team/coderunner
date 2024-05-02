package subcode; 
public class test {
	public static void main(String args[]) {
		Scanner sc = new Scanner(System.in); 
		int out = 0;
		while(sc.hasNext()) {
			out += sc.nextInt();
		}
		System.out.print(out);
	}
}