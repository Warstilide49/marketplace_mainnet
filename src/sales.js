import {Contract} from 'near-api-js'
import {populateSales} from "./saleHandling.js"
import {clearContentBody, provokeLogin} from "./utils.js"
import * as pagination from './pagination'

export async function createDOM(current=1) {

	let main_container=document.createElement("div")
	provokeLogin(main_container, "Please Log In with your NEAR Wallet");
	
	let container=document.createElement("div")
	container.innerHTML=`<h1>Available Sales</h1>
						<div id='sales_container'></div>`
	container.id='sales';
	container.classList.add('page_style')

	pagination.createDOM(null, container, current)

    main_container.append(container)
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(main_container, footer)

	populateItems(current)
}

// Think of a way to implement paging as well, next step for sure

async function populateItems(current) {
	let sales_content = document.getElementById('sales_container');
	sales_content.classList.add('standAlone')		// To differentiate between the 2 sales containers(limit changed)
	populateSales(sales_content, (current-1)*9);
}
