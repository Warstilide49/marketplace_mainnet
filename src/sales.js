import {Contract} from 'near-api-js'
import {populateSales} from "./saleHandling.js"
import {clearContentBody, provokeLogin} from "./utils.js"

export async function createDOM(e) {

	let main_container=document.createElement("div")
	provokeLogin(main_container, "Please Log In with your NEAR Wallet");
	
	let container=document.createElement("div")
	container.innerHTML=`<h1>Available Sales</h1>
						<div id='sales_container'></div>`
	container.id='sales';
	container.classList.add('page_style')

    main_container.append(container)
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(main_container, footer)

	populateItems()
}

// Think of a way to implement paging as well, next step for sure

async function populateItems() {
	let sales_content = document.getElementById('sales_container');
	sales_content.classList.add('standAlone')		// To differentiate between the 2 sales containers(limit changed)
	populateSales(sales_content);
}
