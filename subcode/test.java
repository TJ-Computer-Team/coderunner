package subcode;

public class test
{
    private static void addItself(int i)
    {
        addItself(i+i);   //calling itself with no terminating condition
    }
     
    public static void main(String[] args) 
    {
        addItself(10);
    }
}