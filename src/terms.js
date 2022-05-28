import {clearContentBody} from "./utils.js"

export function createDOM(){
	let main_container=document.createElement("div")
	
	let container=document.createElement("div")
	container.innerHTML=
		`<h1>Terms and Conditions</h1>
		<div id='tc_content'></div>`

	container.id='terms';
	container.classList.add('page_style')
	container.classList.add('anchor_bg')

    main_container.append(container)
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(main_container, footer)

	populate()
}

function populate(){
	let container = document.getElementById('tc_content')
	container.innerHTML = 
		`<p>1. This website is in public beta and there could be loss of data and digital assets while upgrading.</p>
		<p>2. Taxes on digital assets in India stand at 30% at the moment. This amount will be deducted from the proceeds of any transaction in addition to our commission of 5%.</p> `
}