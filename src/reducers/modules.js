import _ from 'lodash';

import { StateTemplates, TransitionTemplates, StructureTemplates } from '../templates/Templates';

const initialState = {};

export default (state = initialState, action) => {
  let newState = null;
  switch (action.type) {
    case 'NEW_MODULE':
      newState = {...state}
      newState[action.data.key] = action.data.module;
      return newState

    case 'EDIT_NODE':
      let path = action.data.path.join('.');
      let value = Object.values(action.data.update)[0]
      if(typeof value === 'object') {
        value = value.id;
      }
      newState = {...state};
      if(value) {
        value = typeof value === 'string'? value.trim():value;
        _.set(newState, path, value);
      }
      else{
        _.unset(newState, path);
        // debugger
        let parent = [...action.data.path].splice(0, action.data.path.length -1).join(".");
        let newVal = _.get(newState, parent);
        if(Array.isArray(newVal)) {
          _.set(newState, parent, newVal.filter(x => x));
        }
      }

      return {...newState}

    case 'ADD_STRUCTURE':
      newState = {...state};
      newState[action.data.currentModuleKey].states = {...newState[action.data.currentModuleKey].states, ...StructureTemplates[action.data.structureName]};
      return newState

    case 'ADD_TRANSITION':
      newState = {...state};

      let transitionMapping = {
        Conditional: 'conditional_transition',
        Distributed: 'distributed_transition',
        Direct: 'direct_transition',
        Complex: 'complex_transition',
      };
      let transitionName = transitionMapping[action.data.transitionType] || 'direct_transition';
      let paths = Object.values(transitionMapping);
      for (var pathIndex in paths) {
        delete newState[action.data.currentModuleKey].states[action.data.nodeName.name][paths[pathIndex]];
      }
      newState[action.data.currentModuleKey].states[action.data.nodeName.name][transitionName] = _.clone(TransitionTemplates[action.data.transitionType]);
      return newState

    case 'ADD_NODE':
      newState = {...state};
      newState[action.data.currentModuleKey].states = {...newState[action.data.currentModuleKey].states, [action.data.stateKey]:action.data.state};
      return {...newState}

    case 'RENAME_NODE':
      newState = {...state};
      let oldState = newState[action.data.targetModuleKey].states[action.data.targetNode.name];
      newState[action.data.targetModuleKey].states[action.data.newName.name] = {...oldState, name: action.data.newName.name};
      delete newState[action.data.targetModuleKey].states[action.data.targetNode.name];
      return newState;
    case 'EDIT_MODULE_NAME':
      newState = {...state};
      newState[action.data.targetModuleKey].name = action.data.newName;
      return newState;
    case 'EDIT_MODULE_REMARKS':
      newState = {...state};
      newState[action.data.targetModuleKey].remarks = [action.data.newRemarks]; // Need to split into rows for readability
      return newState;
    case 'CHANGE_STATE_TYPE':
      newState = {...state};
      let newType = action.data.newType.type.id;
      // This line is weird because we need to add the new fields, overwrite any shared fields, then overwrite the type fields
      // TODO figure out how to remove unused fields
      newState[action.data.targetModuleKey].states[action.data.targetNode.name] =
        { ...StateTemplates[newType],
          ..._.pick(newState[action.data.targetModuleKey].states[action.data.targetNode.name], ['direct_transition', 'conditional_transition', 'distributed_transition', 'complex_transition', 'remarks']),
          type: StateTemplates[newType].type
        };
      return newState
    default:
      return state;
  }
}
