var express = require("express");
var app = express();
var mongoose = require("mongoose");
var expressSanitizer = require("express-sanitizer");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");


mongoose.connect("mongodb+srv://sand123:sand123@cluster0-t0jwv.gcp.mongodb.net/drinkprime?retryWrites=true&w=majority", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); 
app.use(methodOverride("_method"));
app.set("view engine","ejs");

var userSchema = mongoose.Schema({
	username : String,
	password : String
});
userSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", userSchema);

var leadSchema = mongoose.Schema({
	name: String,
	mobile: String,
	email: String,
	address: String,
	area: String
});
var Lead = mongoose.model("Lead",leadSchema);


app.use(require("express-session")({
	secret: "This is secret btw",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});



app.get("/", function(req,res){
	res.redirect("/login");
});

app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register", function(req,res){
	User.register(new User({username: req.body.username}),req.body.password,function(err,user){
		if(err){
			console.log(err);
		}else{
			passport.authenticate("local")(req,res, function(){
				res.redirect("/login")
			});
		}
	});
});

app.get("/login",function(req,res){
	res.render("login");
});

app.post("/login",passport.authenticate("local",
{
	successRedirect: "/leads",
	failureRedirect: "/login"
	}), function(req,res){
});

app.get("/createLead",isLoggedIn,function(req,res){
	res.render("createList")
});

app.post("/createLead",isLoggedIn,function(req,res){
	req.body.lead.body = req.sanitize(req.body.lead.body);
	Lead.create(req.body.lead,function(err,lead){
		if(err){
			res.redirect("/createLead");
		}else{
			res.redirect("/leads");
		}
	});
});

app.get("/leads",isLoggedIn,function(req,res){
	Lead.find({},function(err,leads){
		if(err){
			console.log(err);
		}else{
			res.render("leads",{leads:leads});
		}
	});
});

app.get("/viewLead/:id",isLoggedIn,function(req,res){
	var id = req.params.id;
	Lead.findById(id,function(err,lead){
		if(err){
			console.log(err);
		}else{
			res.render("viewLead",{lead:lead});
		}
	});
});

app.delete("/deleteLead/:id",isLoggedIn,function(req,res){
	Lead.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/leads");
		}else{
			res.redirect("/leads");
		}
	});
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/login");
});


function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

app.listen(process.env.PORT,process.env.IP,function(){
	console.log("Started");
});
