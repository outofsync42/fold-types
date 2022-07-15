# About

Fold Types is a VSCode extension that provides commands to fold enabled types (classes, functions, arrays, etc...) recursively from any point in the document rather than folding levels to provide a more intuitive method of folding. Types can be enabled or disabled in the extension settings based on syntax (php, js, etc..) to match your desired folding needs.

When calling a fold-type command, enabled types will fold recursively leaving all other disabled types un-collapsed providing faster navigation to code that you are looking for. You can fold recursively throughout the entire document or from within a single parent that will only fold enabled types recursively inside the parent leaving everything out side of it untouched.

# Supported Languages

There is no VSCode API to get fold points or types so syntax checking and pattern matching are done manually. As a result, only certain languages (the ones I use) are currently supported. 

- HTML
- CSS
- Javascript
- PHP
- PHP (Mixed HTML, JS, CSS)

While this has been heavily tested to catch all patterns, there may be some outliers that fell through the cracks. If you notice something fold that shouldn't or something not fold that should please submit a bug request and I will look into it as soon as possible. Also if there is a language not supported and I get enough requests that make it worth the time to add I will take the time to learn the syntax and patterns and add them.

# Commands

## Fold
<dl>
  <dt><b>fold-types.fold-all</b></dt>
  <dd>Folds all enabled types recursively through out the entire document.</dd>
  <dt><b>fold-types.fold-parent</b></dt>
  <dd>Folds all enabled types recursively through out the parent block only as well as collapsing the parent its self.</dd>
  <dt><b>fold-types.fold-children</b></dt>
  <dd>Folds all enabled types recursively through out the parent block only but leaves the parent block un-collapsed.</dd>
  <dt><b>fold-types.fold-children-all-types</b></dt>
  <dd>Special command to ignore rules and fold all children recursively regardless of type leaving the parent block un-collapsed.</dd>
</dl>

## Unfold

<dl>
  <dt><b>fold-types.unfold-parent</b></dt>
  <dd>Unfolds all types regardless of type inside the parent as well as unfolding the parent is self.</dd>
</dl>

You can and should still use the existing **editor.unfoldAll** command to unfold the entire document.

# Configuration Settings

Fold Types comes configured with a few enabled types that I feel to be the most intuitive items to be folded but almost any type can configured to be folded or ignored based on your needs.
The easiest way to configure enabled types is to right click on the extension in your extensions list and select "Extension Settings".

![Right Click Extension](https://raw.githubusercontent.com/outofsync42/fold-type/master/images/right-click-extension.png)
![Extension Settings](https://raw.githubusercontent.com/outofsync42/fold-type/master/images/extension-settings.png)

## JS

- fold-types.js.class	
- fold-types.js.method <mark>(default enabled)</mark>
- fold-types.js.interface
- fold-types.js.object <mark>(default enabled)</mark>
- fold-types.js.objectFunctionParam ***(Matches objects passed as parameters to functions)***
- fold-types.js.objectObjectParam <mark>(default enabled)</mark> ***(Matches objects inside other objects)***
- fold-types.js.array <mark>(default enabled)</mark>
- fold-types.js.arrayFunctionParam ***(Matches arrays passed as parameters to functions)***
- fold-types.js.arrayObjectParam <mark>(default enabled)</mark> ***(Matches arrays inside other objects)***
- fold-types.js.while
- fold-types.js.if
- fold-types.js.else
- fold-types.js.for
- fold-types.js.switch
- fold-types.js.switchCase <mark>(default enabled)</mark>
- fold-types.js.switchDefault
- fold-types.js.try
- fold-types.js.tryCatch
- fold-types.js.tryFinally
- fold-types.js.comment

## PHP

- fold-types.php.class	
- fold-types.php.method <mark>(default enabled)</mark>
- fold-types.php.interface
- fold-types.php.array <mark>(default enabled)</mark>
- fold-types.php.arrayFunctionParam ***(Matches arrays passed as parameters to functions)***
- fold-types.php.arrayObjectParam <mark>(default enabled)</mark> ***(Matches arrays inside other arrays)***
- fold-types.php.while
- fold-types.php.if
- fold-types.php.else
- fold-types.php.for ***(Includes foreach)***
- fold-types.php.switch
- fold-types.php.switchCase <mark>(default enabled)</mark>
- fold-types.php.switchDefault
- fold-types.php.try
- fold-types.php.tryCatch
- fold-types.php.tryFinally
- fold-types.php.comment

## HTML

Only the most common tags have been included but if there are some that the community wants they can be added later.

- fold-types.html.head
- fold-types.html.body
- fold-types.html.div
- fold-types.html.section
- fold-types.html.ul
- fold-types.html.a
- fold-types.html.select
- fold-types.html.button
- fold-types.html.script
- fold-types.html.style
- fold-types.html.table
- fold-types.html.tableTbody
- fold-types.html.tableThead
- fold-types.html.tableTfoot
- fold-types.html.tableTr <mark>(default enabled)</mark>
- fold-types.html.tableTd <mark>(default enabled)</mark> ***(Includes \<th\>)***
- fold-types.html.comment
- fold-types.html.idAttribute <mark>(default enabled)</mark> ***(Special: Folds any tag that has an id="" attribute set)***

## CSS

- fold-types.css.block <mark>(default enabled)</mark>