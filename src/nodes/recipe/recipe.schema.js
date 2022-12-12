const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios"); // Define your axios instance in the utils folder

class Recipe extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "recipe",
        label: "Recipe",
        category: "Maya",
        isConfig: false,
        fields: {
            action: new fields.SelectFieldSet({
                optionNameMap: {
                    add_recipe: "Add Recipe",
                    get_recipe: "Get Recipe",
                    delete_recipe: "Delete Recipe",
                    update_recipe: "Update Recipe",
                    list_recipes: "List Recipes",
                    teach_recipe: "Teach Recipe",
                },
                fieldSets: {
                    add_recipe: {},
                    get_recipe: {
                        recipeId_1: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Recipeid",
                        }),
                    },
                    delete_recipe: {
                        recipeId_2: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Recipeid",
                        }),
                    },
                    update_recipe: {
                        recipeId_3: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Recipeid",
                        }),
                    },
                    list_recipes: {},
                    teach_recipe: {
                        request_body_5: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "undefined",
                        }),
                    },
                },
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Making request...");
        let requestConfig = {};

        if ((vals.action.selected = "add_recipe")) {
            requestConfig = {
                url: `/api/v1/library/recipe/new`,
                method: "post",
                data: {},
            };
        }

        if ((vals.action.selected = "get_recipe")) {
            requestConfig = {
                url: `/api/v1/library/recipe/${vals.action.childValues.recipeId_1}`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "delete_recipe")) {
            requestConfig = {
                url: `/api/v1/library/recipe/${vals.action.childValues.recipeId_2}`,
                method: "delete",
                data: {},
            };
        }

        if ((vals.action.selected = "update_recipe")) {
            requestConfig = {
                url: `/library/recipe/${vals.action.childValues.recipeId_3}`,
                method: "put",
                data: {},
            };
        }

        if ((vals.action.selected = "list_recipes")) {
            requestConfig = {
                url: `/api/v1/library/recipes`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "teach_recipe")) {
            requestConfig = {
                url: `/api/v1/library/recipe/teach`,
                method: "post",
                data: {
                    request_body: vals.action.childValues.request_body_5,
                },
            };
        }

        try {
            const response = await axios(requestConfig);
            msg.payload = response.data;
            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            console.log("There was an error making the request:", e);
            this.setStatus(
                "ERROR",
                "There was an error making the request:" + e.toString()
            );
        }
        return msg;
    }
}

module.exports = Recipe;
