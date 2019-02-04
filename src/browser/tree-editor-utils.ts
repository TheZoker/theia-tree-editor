import { JsonSchema7 } from '@jsonforms/core';
import { getData, getSchema, getUiSchema, JsonSchema } from '@jsonforms/core';
import { Property } from '@jsonforms/material-tree-renderer';
import * as _ from 'lodash';

export interface TreeEditorProps {
  uischema: any;
  schema: any;
  rootData: any;
  filterPredicate: any;
  labelProvider: any;
  imageProvider: any;
  saveable: any;
  widget: any;
}

export interface LabelDefinition {
  /** A constant label value displayed for every object for which this label definition applies. */
  constant?: string;
  /** The property name that is used to get a variable part of an object's label. */
  property?: string;
}

const getLabelWithProvider = (schema: JsonSchema7, element:Object, labelProvider): string => {
  if (!_.isEmpty(labelProvider) && labelProvider[schema.$id] !== undefined) {

    if (typeof labelProvider[schema.$id] === 'string') {
      // To be backwards compatible: a simple string is assumed to be a property name
      return element[labelProvider[schema.$id]];
    }
    if (typeof labelProvider[schema.$id] === 'object') {
      const info = labelProvider[schema.$id] as LabelDefinition;
      let label;
      if (info.constant !== undefined) {
        label = info.constant;
      }
      if (!_.isEmpty(info.property) && !_.isEmpty(element[info.property])) {
        label = _.isEmpty(label) ?
          element[info.property] :
          `${label} ${element[info.property]}`;
      }
      if (label !== undefined) {
        return label;
      }
    }
  }
  return undefined;
}

export const calculateLabel = (labels) =>
  (schema: JsonSchema7) => (element: Object): string => {

    const label = getLabelWithProvider(schema, element, labels);
    if(label) {
      return label;
    }

    const namingKeys = Object
      .keys(schema.properties)
      .filter(key => key === '$id' || key === 'name' || key === 'type');
    if (namingKeys.length !== 0) {
      return element[namingKeys[0]];
    }

    return JSON.stringify(element);
  };

export const filterPredicate = (modelMapping) => (data: Object) => {
  return (property: Property): boolean => {
    if (modelMapping !== undefined && modelMapping.mapping !== undefined) {
      if (data[modelMapping.attribute]) {
        if (property.schema.hasOwnProperty('$id')) {
          return property.schema['$id'] === modelMapping.mapping[data[modelMapping.attribute]];
        } else if (property.schema.hasOwnProperty('id')) {
          return property.schema['id'] === modelMapping.mapping[data[modelMapping.attribute]];
        }
      }
      return true;
    }

    return false;
  };
};

export const mapStateToTreeEditorProps = (state, ownProps) => {
  return {
    uischema: getUiSchema(state),
    schema: getSchema(state),
    filterPredicate: ownProps.filterPredicate,
    labelProviders: {
      forData: ownProps.labelProvider,
      forSchema: (schema: JsonSchema, schemaPath: string) => schema.properties['type'].default
    },
    imageProvider: ownProps.imageProvider,
    rootData: getData(state)
  };
};
