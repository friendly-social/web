# Exhaustive deps

In this project, this rule was disabled, react hooks just do not work as a
simple mechanic variable tracking mechanism. In every place hooks are used,
developer should ask themselves: "When this thing should be reran?". And only
include dependencies that explicitly indicate when hooks rerun. 

With exhaustive-deps plugin, it helps a lot of junior developers who do not know
how hooks work, but on the other hand it clutters codebase and requires you to
write a lot of strange workarounds when you just want to do some basic stuff.
