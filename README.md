# TJ Computer Team Coderunner
This is the second part of the TJCT autograder system, which communicates with the [frontend](https://github.com/TJ-Computer-Team/autograder2) to receive submissions. It is written in rust and uses [actix web](https://github.com/actix/actix-web) to build the API. 


## File Structure
```
/home/tjctgrader
├── coderunner/
│   ├── dev/                 # Dockerfile and nsjail configs
│   ├── nsjail/              # Used for sandboxing user code
│   ├── src/
│   │   ├── main.rs          # Application entrypoint and server setup
│   │   ├── models.rs        # Form models for API endpoints
│   │   ├── runner.rs        # Core logic for running and checking code
│   │   └── routes/
│   │       ├── mod.rs       # Route registration
│   │       ├── run.rs       # /run endpoint, calls functions from runner.rs to run code
│   │       └── add.rs       # /addTest and /addProblem endpoints
├── problems/
│   └── [problem_id]/       
│       ├── default_checker.py    # Checker file
│       ├── sol/                  # Expected outcomes
│       │   ├── 1
│       │   ├── 2
│       │   └── 3
│       └── test/                 # Inputs
│           ├── 1
│           ├── 2
│           └── 3
└── submissions/             # Temporary storage of user submissions
```

## Building & Running
Go to [the devenv repo](https://github.com/TJ-Computer-Team/devenv) and run `run.sh` to build and run the entire app.
