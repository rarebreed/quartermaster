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
via Observable streams.