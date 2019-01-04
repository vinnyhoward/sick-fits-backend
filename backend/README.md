# Advanced-React - GraphQL, GraphQL Yoga, Next.js, Prisma 

## Work Flow

### Creating a Query

1. Inside of ```Schema.graphql``` create your ```query``` that will take an ```X``` amount of arguments that need to be statically typed. Use ```!``` to require any argument needed.
Many of the functions available can be referenced in the ```prisma.graphql``` file which acts as an API for your project

Example: 

```
type Query {
	items: [Item]!
	item(where: ItemWhereUniqueInput!): Item 
  // ItemWhereUniqueInput come from the prisma.graphql API
}
```
2. In the ```resolvers``` folder, you will open up the ```Query.js``` and create ```function``` aka ```resolvers``` to interact with your ```query``` from your ```Schema.graphql```

```
const { forwardTo } = require('prisma-binding');

const Query = {
	item: forwardTo('db'),
	async items(parent, args, ctx, info) {
		console.log('Am i running');
		const items = await ctx.db.query.items();
		return items;
	}
};

module.exports = Query;
```

3. Open up your GraphQL playground through your server host, for example in this project, it is at ```http://localhost:4444/```. Test your ```query```, see if it exists and works as expected

Example Query:

```
query allItems {
  items {
    id
    title
    description
    largeImage
  }
}
```

### Creating a Mutation (Create)

1. Inside of ```Schema.graphql``` create your ```mutation``` that will take an ```X``` amount of arguments that need to be statically typed. Use ```!``` to require any argument needed.
Many of the functions available can be referenced in the ```prisma.graphql``` file which acts as an API for your project

Example: 

```
type Mutation {
	createItem(title: String, description: String, price: Int, image: String, largeImage: String): Item!
	updateItem(id: ID!, title: String, description: String, price: Int): Item!
}
```

2. In the ```resolvers``` folder, you will open up the ```Mutation.js``` and create ```function``` aka ```resolvers``` to interact with your ```mutation``` from your ```Schema.graphql``` 

Create Mutation Example:

```
const Mutations = {
	async createItem(parent, args, ctx, info) {

		const item = await ctx.db.mutation.createItem(
			{
				data: {
					...args
				}
			},
			info
		);

		console.log(item);

		return item;
	},
};

module.exports = Mutations;
```

Update Mutation Example:

```
	updateItem(parent, args, ctx, info) {
		const updates = { ...args };
		delete updates.id;
		return ctx.db.mutation.updateItem(
			{
				data: updates,
				where: {
					id: args.id 
				}
			},
			info
		); 
	}

module.exports = Mutations;
```

3. Open up your GraphQL playground through your server host, for example in this project, it is at ```http://localhost:4444/```. Test your ```mutation```, see if it exists and works as expected

Example Mutation: 

```
mutation createCoolShit {
  createItem(
    title: "Fly Kicks"
    description: "These kicks be fly mah dude"
    image: "sick-kicks.jpg",
    largeImage: "even-larger-sick-kicks.jpg",
    price: 10000000
  )
  {
    id
    title
  }
}
```
