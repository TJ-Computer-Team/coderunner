pid, test= input().split()
f = open("../../problems/"+pid+"/sol/"+test, "r").readlines()
f2 = open("output.txt", "r").readlines()

if (len(f) != len(f2)):
        x = ''.join(f2)[:10]
        x = x.strip()
        if len(x)==0:
              print(f"User didn't output anything")
        else:
              print(f"User output was {x}")
        print("Verdict: WA")
        exit()

t = 0
for i, j in zip(f, f2):
        if i.strip() != j.strip():
                f3 = open("../../problems/"+pid+"/test/"+test, "r").readlines()
                print(f"Failed on test {t}:\n")
                for line in f3[:10]:
                        line = line.strip()
                        print(line[:100], end="")
                        if len(line) > 100:
                                print("...")
                        else:
                                print()
                if len(f3) > 10:
                        print("...")
                print()
                print(f"User output was {j.strip()}; correct is {i.strip()}.")
                print("Verdict: WA")
                exit()
        t += 1

print("AC")
