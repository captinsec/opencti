import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import graphql from 'babel-plugin-relay/macro';
import { createFragmentContainer } from 'react-relay';
import { Formik, Field, Form } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import {
  assoc, compose, pick, pipe,
} from 'ramda';
import * as Yup from 'yup';
import inject18n from '../../../../components/i18n';
import TextField from '../../../../components/TextField';
import DatePickerField from '../../../../components/DatePickerField';
import { SubscriptionFocus } from '../../../../components/Subscription';
import { commitMutation, WS_ACTIVATED } from '../../../../relay/environment';
import { dateFormat } from '../../../../utils/Time';

const styles = theme => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    position: 'fixed',
    overflow: 'hidden',
    backgroundColor: theme.palette.navAlt.background,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: '30px 30px 30px 30px',
  },
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  importButton: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
});

const incidentMutationFieldPatch = graphql`
  mutation IncidentEditionDetailsFieldPatchMutation(
    $id: ID!
    $input: EditInput!
  ) {
    incidentEdit(id: $id) {
      fieldPatch(input: $input) {
        ...IncidentEditionDetails_incident
      }
    }
  }
`;

const incidentEditionDetailsFocus = graphql`
  mutation IncidentEditionDetailsFocusMutation(
    $id: ID!
    $input: EditContext!
  ) {
    incidentEdit(id: $id) {
      contextPatch(input: $input) {
        id
      }
    }
  }
`;

const incidentValidation = t => Yup.object().shape({
  first_seen: Yup.date()
    .typeError(t('The value must be a date (YYYY-MM-DD)'))
    .required(t('This field is required')),
  last_seen: Yup.date()
    .typeError(t('The value must be a date (YYYY-MM-DD)'))
    .required(t('This field is required')),
  objective: Yup.string(),
});

class IncidentEditionDetailsComponent extends Component {
  handleChangeFocus(name) {
    if (WS_ACTIVATED) {
      commitMutation({
        mutation: incidentEditionDetailsFocus,
        variables: {
          id: this.props.incident.id,
          input: {
            focusOn: name,
          },
        },
      });
    }
  }

  handleSubmitField(name, value) {
    incidentValidation(this.props.t)
      .validateAt(name, { [name]: value })
      .then(() => {
        commitMutation({
          mutation: incidentMutationFieldPatch,
          variables: {
            id: this.props.incident.id,
            input: { key: name, value },
          },
        });
      })
      .catch(() => false);
  }

  render() {
    const {
      t, incident, editUsers, me,
    } = this.props;
    const initialValues = pipe(
      assoc('first_seen', dateFormat(incident.first_seen)),
      assoc('last_seen', dateFormat(incident.last_seen)),
      pick(['first_seen', 'last_seen', 'objective']),
    )(incident);

    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={incidentValidation(t)}
          onSubmit={() => true}
          render={() => (
            <div>
              <Form style={{ margin: '20px 0 20px 0' }}>
                <Field
                  name="first_seen"
                  component={DatePickerField}
                  label={t('First seen')}
                  fullWidth={true}
                  onFocus={this.handleChangeFocus.bind(this)}
                  onSubmit={this.handleSubmitField.bind(this)}
                  helperText={
                    <SubscriptionFocus
                      me={me}
                      users={editUsers}
                      fieldName="first_seen"
                    />
                  }
                />
                <Field
                  name="last_seen"
                  component={DatePickerField}
                  label={t('Last seen')}
                  fullWidth={true}
                  style={{ marginTop: 10 }}
                  onFocus={this.handleChangeFocus.bind(this)}
                  onSubmit={this.handleSubmitField.bind(this)}
                  helperText={
                    <SubscriptionFocus
                      me={me}
                      users={editUsers}
                      fieldName="last_seen"
                    />
                  }
                />
                <Field
                  name="objective"
                  component={TextField}
                  label={t('Objective')}
                  fullWidth={true}
                  multiline={true}
                  rows={4}
                  style={{ marginTop: 10 }}
                  onFocus={this.handleChangeFocus.bind(this)}
                  onSubmit={this.handleSubmitField.bind(this)}
                  helperText={
                    <SubscriptionFocus
                      me={me}
                      users={editUsers}
                      fieldName="objective"
                    />
                  }
                />
              </Form>
            </div>
          )}
        />
      </div>
    );
  }
}

IncidentEditionDetailsComponent.propTypes = {
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
  incident: PropTypes.object,
  editUsers: PropTypes.array,
  me: PropTypes.object,
};

const IncidentEditionDetails = createFragmentContainer(
  IncidentEditionDetailsComponent,
  {
    incident: graphql`
      fragment IncidentEditionDetails_incident on Incident {
        id
        first_seen
        last_seen
        objective
      }
    `,
  },
);

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(IncidentEditionDetails);
