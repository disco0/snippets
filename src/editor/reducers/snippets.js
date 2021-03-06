import {
  CREATE_SNIPPET,
  RENAME_SNIPPET,
  UPDATE_SNIPPET,
  DELETE_SNIPPET,
  LOADING_SNIPPETS,
  LOADED_SNIPPETS,
  SAVING_SNIPPETS,
  SAVED_SNIPPETS,
  LOADED_LEGACY_SNIPPETS
} from "../actions/snippets";
import * as settingsActions from "../actions/settings";
import { mergeDeep as merge } from "../util/deep-merge";

// eslint-disable-next-line no-unused-vars
const welcomeSnippet = `
/***********************
* Welcome to snippets! *
***********************/

console.log('Welcome to snippets!')

/*
CONTROLS

  * Run a snippet in the page that you opened the devtools on
    CTRL+ENTER
    (You must have the snippet focused)

  * Toggle the devtools console
    ESC


EVERYTHING IS AUTOSAVED

  Once you stop typing, your work will be automatically saved


SYNC

  Your snippets will be synced to any Chrome that you're logged into


BUGS / ISSUES / SUGGESTIONS

  Open an issue on this project's Github
  https://github.com/SidneyNemzer/snippets/issues


HAPPY CODING!
*/
`;

const nextUniqueName = (name, existingNames, append = 0) =>
  existingNames.includes(name + (append ? "-" + append : ""))
    ? nextUniqueName(name, existingNames, append + 1)
    : name + (append ? "-" + append : "");

const defaultState = {
  loading: true,
  error: null,
  data: null
};

const mergeState = oldState => newState => merge({}, oldState, newState);

const snippets = (state = defaultState, action) => {
  const update = mergeState(state);
  switch (action.type) {
    case CREATE_SNIPPET:
      return !state.loading && state.data
        ? update({
            data: {
              [nextUniqueName("untitled", Object.keys(state.data))]: {
                deleted: false,
                renamed: false,
                content: {
                  local: "",
                  remote: false
                }
              }
            }
          })
        : state;
    case RENAME_SNIPPET:
      return !state.loading &&
        state.data &&
        state.data[action.oldName] &&
        action.newName
        ? update({
            data: {
              [action.oldName]: {
                renamed:
                  action.newName === action.oldName ? false : action.newName
              }
            }
          })
        : state;
    case UPDATE_SNIPPET:
      return !state.loading && state.data
        ? update({
            data: {
              [action.name]: {
                lastUpdatedBy: action.editorId,
                content: {
                  local: action.newBody
                }
              }
            }
          })
        : state;
    case DELETE_SNIPPET:
      return !state.loading && state.data
        ? update({
            data: {
              [action.name]: {
                deleted: true
              }
            }
          })
        : state;
    case LOADING_SNIPPETS:
      return update({ loading: true, error: null });
    case LOADED_SNIPPETS:
      return action.error
        ? { loading: false, error: action.error }
        : {
            saving: state.saving,
            error: null,
            loading: false,
            data: Object.entries(action.snippets).reduce(
              (snippets, [name, { body }]) => {
                snippets[name] = {
                  deleted: false,
                  renamed: false,
                  content: {
                    local: body,
                    remote: body
                  }
                };
                return snippets;
              },
              {}
            )
          };
    case SAVING_SNIPPETS:
      return update({ saving: true, error: null });
    case SAVED_SNIPPETS:
      return action.error
        ? {
            loading: false,
            saving: false,
            error: action.error,
            data: state.data
          }
        : {
            loading: false,
            saving: false,
            error: null,
            data: Object.entries(state.data).reduce(
              (accum, [name, snippet]) => {
                if (!snippet.deleted) {
                  accum[snippet.renamed ? snippet.renamed : name] = {
                    renamed: false,
                    deleted: false,
                    content: {
                      local: snippet.content.local,
                      remote: snippet.content.local
                    }
                  };
                }
                return accum;
              },
              {}
            )
          };
    case LOADED_LEGACY_SNIPPETS:
      return action.error
        ? {
            loading: false,
            saving: false,
            error: action.error,
            data: state.data
          }
        : {
            loading: false,
            saving: false,
            error: null,
            data: Object.entries(action.snippets).reduce(
              (snippets, [name, body]) => {
                snippets[name] = {
                  renamed: false,
                  deleted: false,
                  content: {
                    local: body,
                    remote: snippets[name] && snippets[name].content.remote
                  }
                };
                return snippets;
              },
              state.data
            )
          };
    case settingsActions.types.gistId:
    case settingsActions.types.accessToken:
      return update({ error: null, data: null });
    default:
      return state;
  }
};

export default snippets;
