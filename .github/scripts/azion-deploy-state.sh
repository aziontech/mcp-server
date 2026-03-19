#!/bin/bash

# Azion Deploy State Management Script
# This script provides functions to manage deployment state in Azion Edge Storage

# Environment variable for bucket name (must be set before calling functions)
# Example: export AZION_DEPLOY_STATE_BUCKET="my-bucket"

# Default environment
DEFAULT_ENV="stage"

# Object key prefix for Edge Storage
OBJECT_KEY_PREFIX="mcp"

# Validate that bucket name is set
validate_bucket_name() {
    if [ -z "$AZION_DEPLOY_STATE_BUCKET" ]; then
        echo "Error: AZION_DEPLOY_STATE_BUCKET environment variable is not set"
        exit 1
    fi
}

# Build files list based on environment
# Arguments:
#   $1 - env: The environment (stage or production)
# Returns: Array of files for the environment
build_files_list() {
    local env="$1"
    echo "azion/${env}/args.json" "azion/${env}/azion.json"
}

# Update an object in Edge Storage
# Arguments:
#   $1 - object-key: The key/path for the object in Edge Storage
#   $2 - source: The local file path to upload
# Returns: Exit code from azion command
update_object() {
    local object_key="$1"
    local source="$2"

    # Validate arguments
    if [ -z "$object_key" ]; then
        echo "Error: object-key argument is required"
        echo "Usage: update_object <object-key> <source>"
        return 1
    fi

    if [ -z "$source" ]; then
        echo "Error: source argument is required"
        echo "Usage: update_object <object-key> <source>"
        return 1
    fi

    # Check if source file exists
    if [ ! -f "$source" ]; then
        echo "Error: Source file '$source' does not exist"
        return 1
    fi

    # Validate bucket name
    validate_bucket_name

    echo "Uploading '$source' to bucket with key '$object_key'"

    azion create storage object \
        --bucket-name "$AZION_DEPLOY_STATE_BUCKET" \
        --object-key "$object_key" \
        --source "$source"

    local result=$?
    if [ $result -eq 0 ]; then
        echo "Successfully uploaded object: $object_key"
    else
        echo "Failed to upload object: $object_key"
    fi

    return $result
}

# Get an object from Edge Storage
# Arguments:
#   $1 - object-key: The key/path for the object in Edge Storage
#   $2 - output: (optional) The local file path to save the object. If not provided, outputs to stdout
# Returns: Exit code from azion command
get_object() {
    local object_key="$1"
    local output="$2"

    # Validate arguments
    if [ -z "$object_key" ]; then
        echo "Error: object-key argument is required"
        echo "Usage: get_object <object-key> [output]"
        return 1
    fi

    # Validate bucket name
    validate_bucket_name

    echo "Downloading object '$object_key' from bucket"

    if [ -n "$output" ]; then
        # Create output directory if it doesn't exist
        local output_dir
        output_dir=$(dirname "$output")
        if [ ! -d "$output_dir" ]; then
            mkdir -p "$output_dir"
        fi

        azion describe storage object \
            --bucket-name "$AZION_DEPLOY_STATE_BUCKET" \
            --object-key "$object_key" --out "$output"

        local result=$?
        if [ $result -eq 0 ]; then
            echo "Successfully downloaded object to: $output"
        else
            echo "Failed to download object: $object_key"
        fi

        return $result
    else
        # Output to stdout
        azion describe storage object \
            --bucket-name "$AZION_DEPLOY_STATE_BUCKET" \
            --object-key "$object_key"

        return $?
    fi
}

# Process all files for upload operation
# Arguments:
#   $1 - env: The environment (stage or production)
upload_all_files() {
    local env="$1"
    local failed=0

    # Build files list for the environment
    local files_list
    files_list=$(build_files_list "$env")

    echo "Starting upload of ${env} files to Edge Storage..."
    echo "Environment: $env"
    echo "---"

    for file_path in $files_list; do
        # Build object key: prefix + file path (mcp/azion/stage/args.json)
        local object_key="${OBJECT_KEY_PREFIX}/${file_path}"

        echo "Processing: $file_path"

        if update_object "$object_key" "$file_path"; then
            echo "✓ Success: $file_path"
        else
            echo "✗ Failed: $file_path"
            ((failed++))
        fi
        echo ""
    done

    echo "---"
    if [ $failed -eq 0 ]; then
        echo "All ${env} files uploaded successfully!"
        return 0
    else
        echo "Failed to upload $failed file(s)"
        return 1
    fi
}

# Process all files for download operation
# Arguments:
#   $1 - env: The environment (stage or production)
download_all_files() {
    local env="$1"
    local failed=0

    # Build files list for the environment
    local files_list
    files_list=$(build_files_list "$env")

    echo "Starting download of ${env} files from Edge Storage..."
    echo "Environment: $env"
    echo "---"

    for file_path in $files_list; do
        # Build object key: prefix + file path (mcp/azion/stage/args.json)
        local object_key="${OBJECT_KEY_PREFIX}/${file_path}"

        echo "Processing: $file_path"

        if get_object "$object_key" "$file_path"; then
            echo "✓ Success: $file_path"
        else
            echo "✗ Failed: $file_path"
            ((failed++))
        fi
        echo ""
    done

    echo "---"
    if [ $failed -eq 0 ]; then
        echo "All ${env} files downloaded successfully!"
        return 0
    else
        echo "Failed to download $failed file(s)"
        return 1
    fi
}

# Only run if script is executed directly (not sourced)
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    # Parse arguments
    command=""
    env="$DEFAULT_ENV"

    while [ $# -gt 0 ]; do
        case "$1" in
            --env|-e)
                env="$2"
                shift 2
                ;;
            upload|download)
                command="$1"
                shift
                ;;
            *)
                echo "Unknown argument: $1"
                shift
                ;;
        esac
    done

    # Check if command was provided
    if [ -z "$command" ]; then
        echo "Azion Deploy State Management"
        echo ""
        echo "Usage: $0 <command> [--env <environment>]"
        echo ""
        echo "Commands:"
        echo "  upload    Upload environment files to Edge Storage"
        echo "  download  Download environment files from Edge Storage"
        echo ""
        echo "Options:"
        echo "  --env, -e    Environment to manage (stage or production). Default: ${DEFAULT_ENV}"
        echo ""
        echo "Environment Variables:"
        echo "  AZION_DEPLOY_STATE_BUCKET    The Edge Storage bucket name (required)"
        echo ""
        echo "Examples:"
        echo "  export AZION_DEPLOY_STATE_BUCKET=\"my-bucket\""
        echo "  $0 upload                              # Upload stage files (default)"
        echo "  $0 download --env production           # Download production files"
        echo "  $0 upload -e stage                     # Upload stage files"
        exit 1
    fi

    # Validate environment
    if [ "$env" != "stage" ] && [ "$env" != "production" ]; then
        echo "Error: Invalid environment '$env'. Must be 'stage' or 'production'"
        exit 1
    fi

    # Validate bucket name before proceeding
    validate_bucket_name

    case "$command" in
        upload)
            upload_all_files "$env"
            ;;
        download)
            download_all_files "$env"
            ;;
        *)
            echo "Unknown command: $command"
            echo "Available commands: upload, download"
            exit 1
            ;;
    esac
fi
