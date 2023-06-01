const express = require("express");
const app = express();
const path = require("path");
const { User, Sports, Session } = require("./models");
const bodypaser = require("body-parser");


const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const flash = require("connect-flash");

app.set("views", path.join(__dirname, "views"));
app.use(flash());

var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");

app.use(bodypaser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Somthing Went Wrong!!!"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
//set EJS as view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.use(
    session({
        secret: "my-super-secret-key-21647134443213215",
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
        },
        resave: true,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
    response.locals.messages = request.flash();
    next();
});


passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password",
        },
        (username, password, done) => {
            User.findOne({
                where: {
                    email: username,
                },
            })
                .then(async (user) => {
                    const result = await bcrypt.compare(password, user.password);
                    if (result) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: "Invalid Password" });
                    }
                })
                .catch((error) => {
                    return done(null, false, { message: "Invalid E-mail" });
                });
        }
    )
);


passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id)
        .then((user) => {
            done(null, user);
        })
        .catch((error) => {
            done(error, null);
        });
});

app.get("/signup", async (request, response) => {
    if (request.isAuthenticated()) {
        return response.redirect("/")
    }
    response.render("signup", {
        csrfToken: request.csrfToken(),
    });
});

app.get("/login", (request, response) => {
    if (request.isAuthenticated()) {
        return response.redirect("/")
    }
    response.render("login", { csrfToken: request.csrfToken() });
});



app.get("/signout", (request, response, next) => {
    request.logout((error) => {
        if (error) {
            return next(error);
        }
        response.redirect("/");
    });
});


app.post("/users", async (request, response) => {
    const hashedpwd = await bcrypt.hash(request.body.password, saltRounds);
    const trimmedPassword = request.body.password.trim();
    if (request.body.firstName.length == 0) {
        request.flash("error", "First Name cant be empty");
        return response.redirect("/signup");
    } else if (request.body.email.length == 0) {
        request.flash("error", "Email cant be empty");
        return response.redirect("/signup");
    } else if (trimmedPassword.length == 0) {
        request.flash("error", "password cannot be empty");
        return response.redirect("/signup");
    }
    try {
        const user = await User.createuser({
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            email: request.body.email,
            password: hashedpwd,
            role: request.body.role,
        });
        console.log(user);
        request.login(user, (err) => {
            if (err) {
                console.log("Error loging in");
                response.redirect("/");
            }
            if (request.body.role == "admin") {
                response.redirect("/admin");
            }
            if (request.body.role == "player") {
                response.redirect("/user");
            }
        });
    } catch (error) {
        console.log(error);
        request.flash("error", "Error! Email Already in use");
        response.redirect("/signup");
    }
})

app.post(
    "/session",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    async (request, response) => {
        console.log(request.user.id);
        if (request.user.role == "admin") {
            response.redirect("/admin");
        }
        if (request.user.role == "player") {
            response.redirect("/user");
        }
    }
);


app.get("/", (request, response) => {
    if (request.isAuthenticated()) {
        if (request.user.role === "admin") {
            response.redirect("/admin");
        } else {
            response.redirect("/user");
        }
    } else {
        response.render("index", {
            failure: false,
            csrfToken: request.csrfToken(),
        });
    }
});


app.get(
    "/admin",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
        console.log(request.user.id);
        const allSports = await Sports.getAllSports();
        const getUser = await User.getUser(request.user.id);

        if (request.accepts("HTML")) {
            response.render("admin", {
                getUser,
                allSports,
                csrfToken: request.csrfToken(),
            });
        } else {
            response.json({
                getUser,
                allSports,
            });
        }
    }
);


app.get(
    "/user",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
        const allSports = await Sports.getAllSports(); 
        const getUser = await User.getUser(request.user.id);
        const sessions = await Session.findAll();
        response.render("player", {
            sessions,
            getUser,
            allSports,
            csrfToken: request.csrfToken(),
        });
    }
);


app.get("/changepassword",connectEnsureLogin.ensureLoggedIn(),async(request,response) => {
    response.render("Changepassword",{
        csrfToken:request.csrfToken(),
    });
});

app.post("/changingpassword",connectEnsureLogin.ensureLoggedIn(),async(request,response) => {
    const getUser = await User.findByPk(request.user.id);
    const result = await bcrypt.compare(request.body.oldpassword, getUser.password);
    if(result){
        const hashedpwd = await bcrypt.hash(request.body.newpassword, saltRounds);
        await User.updatePassword(hashedpwd,request.user.id);
        request.flash('success', 'Password changed successfully');
        return response.redirect(`/`);
    }else{
        request.flash('error', 'Invalid old password');
        return response.redirect(`/changepassword`);
    }
})

app.get(
    "/createsport",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
        response.render("createsport", {
            csrfToken: request.csrfToken(),
        });
    }
);


app.post("/creatingsport", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const sport = await Sports.createSport({ sportname: request.body.sportname, userId: request.user.id });
        const getUser = await User.getUser(request.user.id);
        const allSports = await Sports.getAllSports();
        response.render("adminsessions", {
            sport,
            getUser,
            allSports,
        });
    } catch (err) {
        console.log(err);
    }
})



app.get("/sport/:id/createsession", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const sport = await Sports.findByPk(request.params.id);
    response.render("createsession", {
        sport,
        csrfToken: request.csrfToken()
    });
})

app.post("/sport/:id/createsession", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const players = request.body.players;
        const plyrs = players.split(",").map((p) => p.trim());
        console.log(plyrs);
        const session = await Session.createSession({
            datetime: request.body.datetime,
            venue: request.body.venue,
            participants: plyrs,
            no_of_players: request.body.no_of_players,
            sportid: request.params.id,
            userId: request.user.id,
            sessionvalidity: true
        });
        console.log(session);
        return response.redirect(`/sport/${session.id}`);
    } catch (err) {
        console.log(err);
    }
})

app.get("/sport/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {

        const getUser = await User.findByPk(request.user.id);
        // const sport = await Sports.findByPk(request.params.id);
        // const session = await Session.getSession({ sportId: sport.id });
        const session = await Session.findByPk(request.params.id);
        // const sport = await Sports.getSportById(session.Sports_id);
        
        console.log(session);
        // console.log(sport);
        console.log(getUser);
        response.render("players", {
            // sportID: sport.id,
            // name: sport.sports_name,
            getUser,
            // sport,
            sessions: session,
            messages: request.flash("error"), // Pass the flash error messages to the template

            csrfToken: request.csrfToken(),
        });
    } catch (err) {
        console.log(err);
    }
})


app.get("/sport/:id/editsession", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const session = await Session.findByPk(request.params.id);
    console.log(session);
    console.log(session.Sports_id)
    const sport = await Sports.findByPk(session.Sports_id);
    const getUser = await User.getUser(request.user.id);
    response.render("EditSession", {
        getUser,
        sport,
        sessions: session,
        csrfToken: request.csrfToken(),
    });
})

app.post("/sport/:id/editsession", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const players = request.body.players;
        const plyrs = players.split(",").map((p) => p.trim());
        console.log(plyrs);
        const session = await Session.editSession({
            datetime: request.body.datetime,
            venue: request.body.venue,
            participants: plyrs,
            userId: request.user.id,
            no_of_players: request.body.no_of_players,
            id: request.params.id
        });
        console.log("l", session);
        const sport = await Sports.findByPk(session.Sports_id);
        return response.redirect(`/sport/${sport.id}`);
    } catch (err) {
        console.log(err);
    }
})


app.post("/cancelsession/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const session = await Session.cancelSession({
            sessionvalidity: false,
            id: request.params.id
        })
        console.log(session);
        response.redirect("/")
    } catch (err) {
        console.log(err);
    }
})

app.get("/sport/:name/sessions", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const sport = await Sports.getSportByName(request.params.name);
        console.log(sport[0].dataValues.id);
        const Sessions = await Session.getSession({ sportId: [...sport.map(s => s.dataValues.id)] });
        console.log("ses", Sessions.length);
        const getUser = await User.getUser(request.user.id);
        console.log("u", getUser)
        if(Sessions.length != 0){
            response.render("sessions", {
                getUser,
                sessions: Sessions,
                name: request.params.name,
                csrfToken: request.csrfToken(),
            });
        }else{
            response.redirect(`/sport/${sport[0].dataValues.id}/createsession`);
        }
    } catch (err) {
        console.log(err);
    }
})


app.post("/joinSession/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
      const sessions = await Session.findByPk(request.params.id);
      const getUser = await User.getUser(request.user.id);
      const name = getUser.firstName + getUser.lastName + "(you)";
      const sport1 = await Sports.findByPk(sessions.Sports_id);
      console.log("j", sessions);
      console.log(sessions.Participants);
  
      if (sessions.Participants.includes(name)) {
        request.flash("error", "Participant already exists in the session");
        request.session.save(() => {
          return response.redirect("back");
        });
      } else if (sessions.Participants.length === sessions.no_of_players) {
        request.flash("error", "Session is full");
        request.session.save(() => {
          return response.redirect("back");
        });
      } else {
        sessions.Participants.push(name);
        const s = await Session.joinSession({ id: request.params.id, participants: sessions.Participants });
  
        const sport = await Sports.findByPk(s.Sports_id);
        request.session.save(() => {
          return response.redirect(`/sport/${request.params.id}`);
        });
      }
    } catch (err) {
      console.log(err);
    }
  });
  

app.post("/leaveSession/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const sessions = await Session.findByPk(request.params.id);
        const getUser = await User.getUser(request.user.id);
        const name = getUser.firstName+getUser.lastName + "(you)";
        // console.log("j",sessions)
        // console.log(sessions.Participants);
        if (!sessions.Participants.includes(name)) {
            request.flash('error','Participant does not exist in the session');
            console.log(request.flash('error'))
            return response.redirect('back');
        }
        else{
            const updatedParticipants = sessions.Participants.filter(
                (participant) => participant !== name
            );
            const s = await Session.leaveSession({ id: request.params.id, participants: updatedParticipants })
            const sport = await Sports.findByPk(s.Sports_id);
            // console.log("n",s);
            // console.log(sport)
            return response.redirect(`/sport/${request.params.id}`);
        }
    } catch (err) {
        console.log(err);
    }
})

app.get("/sport/:name/edit", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const sport = await Sports.getSportByName(request.params.name);
        response.render("EditSport", {
            sport,
            csrfToken: request.csrfToken(),
        });
        console.log(sport);
    } catch (err) {
        console.log(err);
    }
})

app.post("/sport/:name/edit", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const new_name = request.body.sportname;
        const updatedsport = await Sports.editSport(new_name, request.params.name);
        console.log(updatedsport);
        // response.render("admin",{
        //     allSports,
        //     csrfToken: request.csrfToken(),
        // });
        response.redirect("/admin");
    } catch (err) {
        console.log(err);
    }
})

app.get("/sport/:name/delete", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        const sport = await Sports.getSportByName(request.params.name);
        await Sports.deleteSportByName(request.params.name);
        await Session.deleteSessionBySportId({ sportId: [...sport.map(s => s.dataValues.id)] })
        response.redirect("/admin");
    } catch (err) {
        console.log(err);
    }
})


app.get("/viewreports",connectEnsureLogin.ensureLoggedIn(),async(request,response) => {
    const usersessions = await Session.getSessionByUserId(request.user.id);
    const allSports = await Sports.getAllSports();
    response.render("reports",{
        usersessions,
        allSports,
    })
})


module.exports = app;