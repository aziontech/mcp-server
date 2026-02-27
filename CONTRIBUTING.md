# Contributing

First off, thanks for taking the time to contribute!

All types of contributions are encouraged and valued. See the Table of Contents for different ways to help and details about how this project handles them. 🎉

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)


## Code of Conduct

This project and everyone participating in it is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## I Have a Question

> If you want to ask a question, we assume that you have read the available [Documentation](README.md).

Before you ask a question, it is better to search for existing [Issues](https://github.com/aziontech/mcp-server/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue.

If you then still feel the need to ask a question and need clarification, we recommend the following:

- Open an [Issue](https://github.com/aziontech/mcp-server/issues/new).
- Provide as much context as you can about what you're running into.

We will then take care of the issue as soon as possible.

## I Want To Contribute

> ### Legal Notice
> When contributing to this project, you must agree that you have authored 100% of the content, that you have the necessary rights to the content, and that the content you contribute may be provided under the project license.

### Reporting Bugs

#### Before Submitting a Bug Report

A good bug report shouldn't leave others needing to chase you up for more information. Therefore, we ask you to investigate carefully, collect information, and describe the issue in detail in your report. Please complete the following steps in advance to help us fix any potential bug as fast as possible.

- Make sure that you are using the latest version.
- Determine if your bug is really a bug and not an error on your side e.g. using incompatible environment or configuration (Make sure that you have read the [documentation](README.md)).
- To see if other users have experienced (and potentially already solved) the same issue you are having, check if there is not already a bug report existing for your bug or error in the [bug tracker](https://github.com/aziontech/mcp-server/issues?q=label%3Abug).
- Collect information about the bug:
  - Stack trace or error logs
  - OS, Platform and Version (Windows, Linux, macOS)
  - Node.js version, runtime environment, or what seems relevant
  - Possibly your input and the output
  - Can you reliably reproduce the issue? And can you also reproduce it with older versions?

We use GitHub issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](https://github.com/aziontech/mcp-server/issues/new). (Since we can't be sure at this point whether it is a bug or not, we ask you not to talk about a bug yet and not to label the issue.)
- Explain the behavior you would expect and the actual behavior.
- Please provide as much context as possible and describe the *reproduction steps* that someone else can follow to recreate the issue on their own. This usually includes your code. For good bug reports you should isolate the problem and create a reduced test case.
- Provide the information you collected in the previous section.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Azion MCP Server, **including completely new features and minor improvements to existing functionality**. Following these guidelines will help maintainers and the community to understand your suggestion and find related suggestions.

#### Before Submitting an Enhancement

- Make sure that you are using the latest version.
- Perform a [search](https://github.com/aziontech/mcp-server/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- If your enhancement is nontrivial,
please open an [Issue](https://github.com/aziontech/mcp-server/issues/new) to discuss the
idea and implementation strategy before submitting a PR.

#### How Do I Submit a Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/aziontech/mcp-server/issues).

- Use a **clear and descriptive title** for the issue to identify the suggestion.
- Provide a **step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why. At this point you can also tell which alternatives do not work for you.
- **Explain why this enhancement would be useful** to most Azion MCP Server users. You may also want to point out the other projects that solved it better and which could serve as inspiration.

### Your First Code Contribution

1. Fork the repo
2. Clone your forked repo
3. Install dependencies with `yarn install`
4. Run the development server with `azion dev`
5. Commit the changes you've developed on your fork
6. If everything looks good, create a pull request on the base repo with your changes.

#### Development Setup

```bash
# Clone and setup
git clone https://github.com/aziontech/mcp-server.git
cd mcp-server
yarn install

# Run locally (server available at http://localhost:3333)
azion dev

# Lint your changes
yarn lint

# Type-check your changes
yarn type-check
```

#### We use semantic commit

To ensure that all commits follow the semantic commit pattern, we have pre-commit hooks configured via Husky.
The hooks are automatically set up when you run `yarn install`.
