// Preview plans, not availability or booking promises. Hours are loaded from Places when configured.
const stop=(name,lat,lng,time,cost,address)=>({name,lat,lng,time,cost,address});
export const PLANS={
 bay:[
  {id:'clay',title:'Clay, coffee & a walk',area:'Potrero Hill, SF',duration:'3h',cost:'$45–65',cover:'pottery',stops:[stop('Clayroom',37.7650,-122.3985,'2–3:30 PM','$35–50','1431 17th St, San Francisco'),stop('Farley’s',37.7622,-122.3972,'3:40–4:10 PM','$6–10','1315 18th St, San Francisco'),stop('Jackson Playground',37.7642,-122.3985,'4:20–5 PM','Free','17th & Arkansas St, San Francisco')]},
  {id:'mission',title:'A little Mission wandering',area:'Mission District, SF',duration:'2.5h',cost:'$15–30',cover:'walk',stops:[stop('Tartine Bakery',37.7614,-122.4241,'10–10:45 AM','$10–20','600 Guerrero St, San Francisco'),stop('Dolores Park',37.7596,-122.4269,'11 AM–noon','Free','Dolores & 19th St, San Francisco'),stop('Bi-Rite Creamery',37.7616,-122.4258,'12:10–12:30 PM','$5–10','3692 18th St, San Francisco')]},
  {id:'waterfront',title:'Coffee, art & the waterfront',area:'Embarcadero, SF',duration:'3.5h',cost:'$35–60',cover:'art',stops:[stop('Ferry Building',37.7955,-122.3937,'10–10:45 AM','$10–20','1 Ferry Building, San Francisco'),stop('Exploratorium',37.8014,-122.3970,'11 AM–12:30 PM','$25–40','Pier 15, San Francisco'),stop('Levi’s Plaza',37.8020,-122.4028,'12:45–1:30 PM','Free','1155 Battery St, San Francisco')]},
 ],
 dmv:[
  {id:'dc-clay',title:'Make something, then wander',area:'Northeast DC',duration:'3h',cost:'$45–75',cover:'pottery',stops:[stop('District Clay Center',38.9262,-76.9713,'2–3:30 PM','$35–60','2414 Douglas St NE, Washington DC'),stop('Zeke’s Coffee',38.9317,-76.9730,'3:45–4:15 PM','$6–10','2300 Rhode Island Ave NE, Washington DC'),stop('Langdon Park',38.9285,-76.9693,'4:25–5 PM','Free','2901 20th St NE, Washington DC')]},
  {id:'dc-art',title:'An afternoon of art',area:'National Mall, DC',duration:'3h',cost:'$0–20',cover:'art',stops:[stop('National Gallery of Art',38.8913,-77.0200,'1–2:15 PM','Free','Constitution Ave NW, Washington DC'),stop('Sculpture Garden',38.8901,-77.0230,'2:20–3 PM','Free','7th St & Constitution Ave NW, Washington DC'),stop('Hirshhorn Museum',38.8882,-77.0229,'3:10–4 PM','Free','Independence Ave SW, Washington DC')]},
  {id:'georgetown',title:'A Georgetown detour',area:'Georgetown, DC',duration:'2.5h',cost:'$10–25',cover:'walk',stops:[stop('Baked & Wired',38.9016,-77.0606,'2–2:45 PM','$10–20','1052 Thomas Jefferson St NW, Washington DC'),stop('Georgetown Waterfront Park',38.9011,-77.0630,'2:50–3:40 PM','Free','3303 Water St NW, Washington DC'),stop('Dumbarton Oaks Park',38.9143,-77.0636,'4–4:30 PM','Free','R St NW, Washington DC')]},
 ]
};
export const INTERESTS=['Hands-on classes','Food spots','Outdoors','Art & culture','Live music','Low-key hangs'];
export const CUISINES=['Italian','Japanese','Mexican','West African','Indian','Korean','Surprise me'];
export const DIETS=['Vegetarian','Vegan','Halal','Kosher','Pescatarian'];
export const ALLERGIES=['Peanuts','Almonds','Cashews','Walnuts','Pecans','Pistachios','Hazelnuts','Milk','Eggs','Soy','Gluten','Fish','Shrimp & crab','Clams & oysters','Sesame','Celery','Mustard','Sulphites','Lupin'];
