# What is quartermaster?

This project is an experiment for creating a cockpit plugin for subscription management.  

## What's different about quartermaster?

Rather than use react + redux, quartermaster uses cycle.js.  Why not use react and redux?  Just because something is 
popular doesn't necessarily mean it's the best, or even good. After a little bit of experimenting with react, I noticed
it is really not all that functional.  You have class based components with this for example. Even with redux, it's easy
to make impure functions in react, or mix and match state based components or using state from redux.  Also, redux was
designed to workaround a limitation in react, namely that react is not...well...reactive.  In fact, the react designers
experimented with using Observables, but apparently they decided it would be hard for beginners.  Angular 2, which also
uses rxjs (and is this more reactive) also suffers from this learning curve.

But why be afraid of FRP? With cycle.js, all side effects are isolated in drivers, and logic is maintained in the main()
function.  State flows through the system rather than being stored in a class or in a redux state store.  Also, the 
advantage of redux being able to "time travel" is also possible with cycle.js.  

Because all side effects are handled inside of drivers, it makes testing of the business logic, and even the VDOM
components easier.

## What's the benefit of using cycle.js?

Being fully reactive, state management is as sane or more sane that react + redux.  This is because all state flows 
via Observable streams.  It is also more purely functional than react which means that testing should be easier.

**Why reactive?**

If you think about a GUI, it's all about making sure that if you update some value, any other values which are related 
to that value also get updated.  This happens all the time.  Consider attaching a pool to get access to content.  
Normally, there is a list of all your already attached pools, so when you run an attach command, you would like to see 
this new pool added to the list.

Another example is monitoring a folder for changes in files.  Wouldn't it be nice to be notified in real-time when 
files in a folder change?  How about monitoring a log file for a certain expression?  Or what if one client needs to be
notified by the server that something changed due to the interaction of another client?

Often, you would result to polling to do a lot of these things.  Or maybe run a separate thread and notify the parent
thread by changing a shared variable.  Some tasks like this can even be handled by events that get emitted.  What 
reactive brings to the table is sane management of Event Emitters.

If you think promises are the answer, Promises were designed for the retrieval of a single scalar value.

## Testing with quartermaster

quartermaster will also strive for unit and integration testing with as little mocking as possible.  This means that any
module which relies on the cockpit.js module will have to run as a cockpit plugin.

Why you ask?  Because cockpit.js is only available from the cockpit server itself.  In other words, you have to load it
via the script tag, which in turn means that when your browser loads the html page, the server will also load the 
cockpit.js file within the browser's global environment.

So basically, the unit/integration tests for quartermaster will be run as its own plugin from within cockpit itself!

# Notes on the quartermaster cockpit plugin

I've been finding it very confusing figuring out the relative paths of files that need to referenced by either the 
main html file (eg index.html for the quartermaster plugin and SpecRunner.html for the quartermaster-test.html) or in 
the webpack.config.js file.  Here are some notes.

## The linked files from ~/.local/share/cockpit

Whatever you have linked to ~/.local/share/cockpit/your-plugin is your base path.  The html file that you use here 
will reference this path.  The cockpit server will _give_ you the base1/ and * directories so that in your html file
you can source include them.  For example, in quartermaster, the quartermaster plugin will be called based on the build
directory.  If you do:

```
ls -al ~/.local/share/cockpit/quartermaster
lrwxrwxrwx. 1 stoner stoner 41 Sep  7 08:32 /home/stoner/.local/share/cockpit/quartermaster -> /home/stoner/Projects/quartermaster/build
```

So in the build/index.html, we can source link the source modules like this:

```html5
<!-- The cockpit server will use the symlink so that it also includes these files -->
<script type="text/javascript" src="../base1/cockpit.js"></script>
<script type="text/javascript" src="../*/po.js"></script>

<!-- The app.js file is in the build directory, and the build directory is our starting path, so we use "." -->
<script type="text/javascript" src="./app.js"></script>
```
